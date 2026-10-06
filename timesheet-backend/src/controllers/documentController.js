const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { pdf } = require('pdf-to-img'); // ใช้ pdf-to-img Pure JS แทน Canvas/pdfjs

// =============================================================
// ฟังก์ชัน Helper สำหรับแปลง PDF หน้าแรกเป็น Image Buffer สำหรับ OCR
// =============================================================
async function convertPdfToImageBuffer(pdfPath) {
  try {
    const document = await pdf(pdfPath, { scale: 2.0 });
    for await (const imageBuffer of document) {
      return imageBuffer; // คืนค่า Buffer ของรูปภาพหน้าแรก (PNG) ออกไปใช้ทำ OCR
    }
    return null;
  } catch (err) {
    console.error('convertPdfToImageBuffer Error:', err);
    return null;
  }
}

// =============================================================
// ฟังก์ชัน Helper สำหรับบันทึกไฟล์ลง Local Storage
// =============================================================
async function uploadToLocalStorage(filePath, originalFilename) {
  try {
    const uploadFolder = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const ext = path.extname(originalFilename);
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const destinationPath = path.join(uploadFolder, fileName);

    fs.copyFileSync(filePath, destinationPath);
    const relativeUrl = `/uploads/${fileName}`;

    return { publicUrl: relativeUrl, storagePath: relativeUrl };
  } catch (err) {
    console.error('Error in uploadToLocalStorage:', err);
    throw err;
  }
}

// =============================================================
// ฟังก์ชัน Preprocessing รูปภาพ
// =============================================================
async function preprocessImage(inputPath) {
  try {
    const outputPath = inputPath.replace(/\.(png|jpg|jpeg|webp|bmp)$/i, '_processed.png');
    await sharp(inputPath).grayscale().normalize().sharpen().toFile(outputPath);
    return outputPath;
  } catch (error) {
    return inputPath;
  }
}

function cleanValue(str) {
  if (!str) return '';
  return str
    .replace(/\(Company Info\)|\(Education Info\)|\(Personal Info\)|\(Application Details\)/gi, '')
    .replace(/เรียน\s*คณบดี.*/gi, '')
    .replace(/พนักผ|พนัก|นักศึกษาออกฝึก.*/gi, '')
    .replace(/รหัสนักศึกษา/gi, '')
    .replace(/Buds/gi, '') 
    .replace(/[|_="'“’‘%]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\s\-\.]+$/, '')
    .trim();
}

function parseExtractedText(text, docCategory) {
  if (!text) return {};

  const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const categoryLower = docCategory ? docCategory.toLowerCase() : '';
  const extracted = {};

  if (categoryLower.includes("01")) {
    const nameMatch = cleanText.match(/(?:เรื่อง|เรียน|ของ|นักศึกษา|ชื่อ)\s*[:\.]*\s*((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/i) ||
                      cleanText.match(/((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/i);
    const dateMatch = cleanText.match(/วันที่\s*[:\.]*\s*([0-9]{1,2}[\s\/\.-]+(?:[0-9]{1,2}|[ก-๙]+)[\s\/\.-]+[0-9]{2,4})/i);

    if (nameMatch) extracted.fullName = cleanValue(nameMatch[1]);
    if (dateMatch) extracted.signedDate = cleanValue(dateMatch[1]);
  }
  else if (categoryLower.includes("02-1")) {
    // ปรับปรุง RegEx ให้จับชื่อผู้ปกครองหลังคำว่า "ข้าพเจ้า" โดยตัดคำฟุ่มเฟือยออก
    const parentMatch = cleanText.match(/ข้าพเจ้า\s*(?:(?:นาย|นาง|นางสาว)\s*)?([ก-๙a-zA-Z\.\-]+(?:\s+[ก-๙a-zA-Z\.\-]+)*?)(?=\s*(?:พักอยู่|บ้านเลขที่|ที่อยู่|เกี่ยวข้องเป็น|ผู้ปกครอง|$))/i);
    
    // ปรับปรุง RegEx ให้จับชื่อนักศึกษาจากตำแหน่งคำว่า "ของ" หรือ "ซึ่งเป็นนักศึกษา" ให้ตรงตัว
    const studentMatch = cleanText.match(/(?:เกี่ยวข้องเป็น.*?ของ|ผู้ปกครองของ|ของ)\s*((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s*(?:รหัส|รหัสนักศึกษา|ซึ่งเป็นนักศึกษา|เข้าฝึก|สังกัด|เรียน|คณบดี|สาขา|$))/i) ||
                         cleanText.match(/ซึ่งเป็นนักศึกษา\s*((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s*(?:รหัส|รหัสนักศึกษา|คณะ|$))/i) ||
                         cleanText.match(/นักศึกษา\s*((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)/i);

    const companyMatch = cleanText.match(/(?:ณ|สถานประกอบการ|บริษัท)\s+([ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|มหาชน|เฮ้าส์|เฮาส์)(?:\s+จำกัด|\s+จํากัด)?)/i) ||
                         cleanText.match(/(บริษัท\s+[ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|มหาชน)?)/i);  
    const dateMatch = cleanText.match(/วันที่\s*[:\.]*\s*([0-9]{1,2}[\s\/\.-]+(?:[0-9]{1,2}|[ก-๙]+)[\s\/\.-]+[0-9]{2,4})/i);

    if (parentMatch) extracted.parentName = cleanValue(parentMatch[1]);
    if (studentMatch) extracted.fullName = cleanValue(studentMatch[1]);
    if (companyMatch) {
      let rawComp = cleanValue(companyMatch[1] || companyMatch[0]);
      rawComp = rawComp.replace(/^(บริษัท\s*)+/i, 'บริษัท ').trim();
      if (!/จำกัด|จํากัด/.test(rawComp) && /จำกัด|จํากัด/.test(cleanText)) {
        rawComp += " จำกัด";
      }
      extracted.companyName = rawComp;
    }
    if (dateMatch) extracted.signedDate = cleanValue(dateMatch[1]);
  }
  else if (categoryLower.includes("02-2")) {
    const nameMatch = cleanText.match(/(?:ชื่อ\s*-\s*สกุล|ชื่อ\s*\/\s*Name|ชื่อ)\s*[:\.]*\s*((?:นาย|นาง|นางสาว)?\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s*(?:รหัส|สาขาวิชา|GPA|1\.|2\.|$))/i);
    const studentIdMatch = cleanText.match(/(?:รหัส|รหัสนักศึกษา|ID)\s*[:\.]*\s*([0-9]{10})/i) || cleanText.match(/\b(6[0-9]{9})\b/);
    const phoneMatch = cleanText.match(/(?:โทรศัพท์|โทร|มือถือ|ติดต่อ)\s*[:\.]*\s*([0-9\s-]{9,12})/i);
    const companyMatch = cleanText.match(/(?:สถานประกอบการ|ชื่อสถานประกอบการ)\s*[:\.]*\s*([ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|เฮ้าส์|เฮาส์)?)(?=\s*(?:BN|B|ระยะเวลา|ตำแหน่ง|ประวัติ|3\.|$))/i) ||
                         cleanText.match(/(บริษัท\s+[ก-๙a-zA-Z0-9\s.-]+?\s*(?:จำกัด|จํากัด|เฮ้าส์|เฮาส์)?)/i);
    const positionMatch = cleanText.match(/(?:ต[ำํ]า?แหน่งงาน(?:ท[ีื]?[่]?สมัคร)?|ต[ำํ]า?แหน่ง)\s*[:._\s]*(.*?)(?=\s*(?:สถานประกอบการ|บริษัท|ระยะเวลา|ท[ีื]?[่]?อย[ู]?[่]?สถาน|แผนท[ีื]?[่]|ประวัติ|$))/i);  
    const dateMatch = cleanText.match(/วันที่\s*[:\.]*\s*([0-9]{1,2}[\s\/\.-]+(?:[0-9]{1,2}|[ก-๙]+)[\s\/\.-]+[0-9]{2,4})/i);

    if (nameMatch) extracted.fullName = cleanValue(nameMatch[1]);
    if (studentIdMatch) extracted.studentId = cleanValue(studentIdMatch[1]);
    if (phoneMatch) extracted.phone = cleanValue(phoneMatch[1]);
    if (companyMatch) {
      let comp = cleanValue(companyMatch[1] || companyMatch[0]);
      extracted.companyName = comp.replace(/\s+(BN|B)$/i, '').trim();
    }
    if (positionMatch) extracted.position = cleanValue(positionMatch[1]);
    if (dateMatch) extracted.signedDate = cleanValue(dateMatch[1]);
  }
  else if (categoryLower.includes("04")) {
    let companyMatch = cleanText.match(/(?:ชื่อสถานประกอบการ|สถานประกอบการ)\s*[:._\s]*((?:บร[ิื]?ษ[ัิ]?[ทธ]?\s*)?[ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|บจ\.))/i)
      || cleanText.match(/((?:บร[ิื]?ษ[ัิ]?[ทธ]?\s+)?[ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|บจ\.))/i);

    if (!companyMatch) {
      companyMatch = cleanText.match(/(?:ชื่อสถานประกอบการ|สถานประกอบการ)\s*[:._\s]*((?:บร[ิื]?ษ[ัิ]?[ทธ]?\s*)?.*?)(?=\s*(?:ต[ำํ]า?แหน่ง|ระยะเวลา|ท[ีื]?[่]?อย[ู]?[่]?|เลขที่|\d+\/\d+|$))/i);
    }

    if (companyMatch) {
      let rawCompany = cleanValue(companyMatch[1] || companyMatch[0]);
      rawCompany = rawCompany.replace(/^(?:ชื่อสถานประกอบการ|สถานประกอบการ)\s*[:._\s]*/i, '').trim();
      if (rawCompany) extracted.companyName = rawCompany;
    }

    const positionMatch = cleanText.match(/(?:ต[ำํ]า?แหน่งงาน(?:ท[ีื]?[่]?สมัคร)?|ต[ำํ]า?แหน่ง)\s*[:._\s]*(.*?)(?=\s*(?:ระยะเวลา|ท[ีื]?[่]?อย[ู]?[่]?สถาน|แผนท[ีื]?[่]?|$))/i);
    if (positionMatch) extracted.position = cleanValue(positionMatch[1]);

    const periodMatch = cleanText.match(/ระยะเวลา\s*[:._\s]*(.*?)(?=\s*(?:ท[ีื]?[่]?อย[ู]?[่]?สถาน|ที่อยู่|แผนท[ีื]?[่]?|$))/i);
    if (periodMatch) extracted.period = cleanValue(periodMatch[1]);

    const addressMatch = cleanText.match(/(?:ท[ีื]?[่]?อย[ู]?[่]?สถานประกอบการ|ท[ีื]?[่]?อย[ู]?[่]?สถานท[ีื]?[่]?ต[ั]?[้]?ง|ท[ีื]?[่]?อย[ู]?[่]?)\s*[:._\s]*(.*?)(?=\s*(?:แผนท[ีื]?[่]?|ลงช[ื]?[่]?อ|น[ั]กศ[ึ]กษา|ว[ั]นท[ีื]?[่]?|\*|$))/i);
    if (addressMatch) {
      let formattedAddress = cleanValue(addressMatch[1]);
      formattedAddress = formattedAddress
        .replace(/(^|\s)(?:ต|ตำบล|แขวง)(?=\s+[ก-๙])/g, '$1ต.')
        .replace(/(^|\s)(?:อ|อำเภอ|เขต)(?=\s+[ก-๙])/g, '$1อ.')
        .replace(/(^|\s)(?:จ|จังหวัด)(?=\s+[ก-๙])/g, '$1จ.')
        .replace(/\s+/g, ' ')
        .replace(/[\s\.\@\@\_\-]+$/, '')
        .trim();
      extracted.address = formattedAddress;
    }

    const flexibleDatePattern = /(\d{4})[\s-./]+(\d{1,2})[\s-./]+(\d{1,2})|(\d{1,2})[\s-./]+(\d{1,2})[\s-./]+(\d{4})/;
    const targetText = extracted.period || cleanText;
    const startDateMatch = targetText.match(flexibleDatePattern);

    if (startDateMatch) {
      let day, month, year;
      if (startDateMatch[1]) { 
        year = parseInt(startDateMatch[1], 10);
        month = parseInt(startDateMatch[2], 10);
        day = parseInt(startDateMatch[3], 10);
      } else if (startDateMatch[4]) { 
        day = parseInt(startDateMatch[4], 10);
        month = parseInt(startDateMatch[5], 10);
        year = parseInt(startDateMatch[6], 10);
      }

      if (day && month && year) {
        const buddhistYear = year < 2500 ? year + 543 : year;
        const formattedDay = String(day).padStart(2, '0');
        const formattedMonth = String(month).padStart(2, '0');
        extracted.startDate = `${formattedDay}/${formattedMonth}/${buddhistYear}`;
      }
    }
  }
  else if (categoryLower.includes("05") || categoryLower.includes("ผลการศึกษา") || categoryLower.includes("transcript")) {
    const studentNameMatch = cleanText.match(/ชื่อ\s*[:\.]*\s*((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/i) ||
                             cleanText.match(/ชื่อ\s*-\s*นามสกุล\s*[:\.]*\s*((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/i);
    const studentIdMatch = cleanText.match(/(?:รหัส\s*[:\.]*|รหัสนักศึกษา\s*[:\.]*)\s*([0-9]{10})/i) || cleanText.match(/\b(6[0-9]{9})\b/);
    const gpaMatch = cleanText.match(/(?:GPA|GPAX|เกรดเฉลี่ยสะสม|เกรดเฉลี่ย)\s*[:\.]*\s*([0-4]\.[0-9]{2})/i) ||
                      cleanText.match(/\b([0-4]\.[0-9]{2})\b/);

    if (studentNameMatch) {
      extracted.fullName = cleanValue(studentNameMatch[1]);
    } else {
      const fallbackName = cleanText.match(/((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)(?=\s*(?:รหัส|รหัสนักศึกษา))/i);
      if (fallbackName) extracted.fullName = cleanValue(fallbackName[1]);
    }

    if (studentIdMatch) extracted.studentId = cleanValue(studentIdMatch[1]);
    if (gpaMatch) extracted.gpa = cleanValue(gpaMatch[1]);
  }
  else if (categoryLower.includes("ตอบกลับ") || categoryLower.includes("ตอบรับ") || categoryLower.includes("03")) {
    if (categoryLower.includes("หน้า 1")) {
      const studentMatch = cleanText.match(/1\.\s*(?:นาย|นาง|นางสาว)?\s*([ก-๙a-zA-Z\s]+?)(?=\s*รหัสนักศึกษา|\s*สาขาวิชา|$)/i) ||
                           cleanText.match(/((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/i);
      const studentIdMatch = cleanText.match(/รหัสนักศึกษา\s*[:\.]*\s*([0-9]{10})/i) || cleanText.match(/\b(6[0-9]{9})\b/);
      const branchMatch = cleanText.match(/สาขาวิชา\s*[:\.]*\s*([ก-๙a-zA-Z\s.-]+?)(?=\s*2\.|\s*ส่วนที่|$)/i);

      const companyMatch = cleanText.match(/ชื่อสถานประกอบการ\s*[:\.]*\s*([ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|มหาชน)?)/i) ||
                           cleanText.match(/(บริษัท\s+[ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|มหาชน)?)/i);
      const coordinatorMatch = cleanText.match(/ชื่อผู้ประสานงาน\s*[:\.]*\s*([ก-๙a-zA-Z\.\s]+)/i);
      const positionMatch = cleanText.match(/ตำแหน่ง\s*[:\.]*\s*([ก-๙a-zA-Z0-9\s.-]+?)(?=\s*โทรศัพท์|$)/i);
      const phoneMatch = cleanText.match(/โทรศัพท์\s*[:\.]*\s*([0-9\s-]{9,12})/i);
      const emailMatch = cleanText.match(/E-Mail\s*[:\.]*\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

      let statusResult = "ไม่ระบุ";
      if (/สามารถรับนักศึกษา|รับจำนวน/i.test(cleanText)) {
        statusResult = "รับ";
      } else if (/ไม่สามารถรับนักศึกษา/i.test(cleanText)) {
        statusResult = "ไม่รับ";
      }

      if (studentMatch) extracted.studentName = cleanValue(studentMatch[1]);
      if (studentIdMatch) extracted.studentId = cleanValue(studentIdMatch[1]);
      if (branchMatch) extracted.branch = cleanValue(branchMatch[1]);
      if (companyMatch) extracted.companyName = cleanValue(companyMatch[1] || companyMatch[0]);
      if (coordinatorMatch) extracted.coordinatorName = cleanValue(coordinatorMatch[1]);
      if (positionMatch) extracted.position = cleanValue(positionMatch[1]);
      if (phoneMatch) extracted.phone = cleanValue(phoneMatch[1]);
      if (emailMatch) extracted.email = cleanValue(emailMatch[1]);
      extracted.responseStatus = statusResult;
    } else if (categoryLower.includes("หน้า 2")) {
      const qualificationMatch = cleanText.match(/รายละเอียดคุณสมบัตินักศึกษา.*?\s*[:\.]*\s*(.*?)(?=\s*4\.|\s*ข้อกำหนดอื่น|$)/i);
      const jobPositionMatch = cleanText.match(/ตำแหน่งงานที่เสนอให้นักศึกษาปฏิบัติ\s*[:\.]*\s*([ก-๙a-zA-Z0-9\s.-]+?)(?=\s*ลักษณะงาน|$)/i);
      const workDaysMatch = cleanText.match(/วันทำงาน\s*[:\.]*\s*(.*?)(?=\s*7\.|\s*สวัสดิการ|$)/i);

      if (qualificationMatch) extracted.qualification = cleanValue(qualificationMatch[1]);
      if (jobPositionMatch) extracted.jobPosition = cleanValue(jobPositionMatch[1]);
      if (workDaysMatch) extracted.workDays = cleanValue(workDaysMatch[1]);
    }
  }

  return extracted;
}

// =============================================================
// 1. อัปโหลดและสแกนเอกสาร
// =============================================================
exports.scanAndSaveDocument = async (req, res) => {
  const absoluteFilePath = req.file ? path.resolve(req.file.path) : null;
  try {
    const userId = req.user?.id ? parseInt(req.user.id) : parseInt(req.body.userId);
    const { docCategory } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: 'ไม่พบข้อมูลนักศึกษา (userId)' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดไฟล์' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();

    let text = '';
    let extractedData = {};
    let originalName = req.file.originalname;
    const targetCategory = docCategory || 'BA Co-op 01 เอกสารติดต่องานสหกิจศึกษา';

    if (ext === '.pdf') {
      try {
        const tempImgBuffer = await convertPdfToImageBuffer(absoluteFilePath);
        
        if (tempImgBuffer) {
          const tempImgPath = absoluteFilePath.replace(/\.pdf$/i, '_pdf_ocr_temp.png');
          fs.writeFileSync(tempImgPath, tempImgBuffer);

          const processedImagePath = await preprocessImage(tempImgPath);
          const { data: ocrResult } = await Tesseract.recognize(processedImagePath, 'tha+eng');
          text = ocrResult.text ? ocrResult.text.trim() : '';

          if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);
          if (processedImagePath !== tempImgPath && fs.existsSync(processedImagePath)) {
            fs.unlinkSync(processedImagePath);
          }
        }

        if (text && text.length > 0) {
          extractedData = parseExtractedText(text, targetCategory);
        } else {
          text = 'สแกนข้อความในไฟล์ PDF ไม่สมบูรณ์';
        }
      } catch (pdfError) {
        console.error('PDF OCR Error:', pdfError);
        text = 'เกิดข้อผิดพลาดในการสแกนไฟล์ PDF';
      }
    } 
    else if (['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)) {
      try {
        const processedImagePath = await preprocessImage(absoluteFilePath);
        const { data } = await Tesseract.recognize(processedImagePath, 'tha+eng');
        text = data.text ? data.text.trim() : '';

        if (processedImagePath !== absoluteFilePath && fs.existsSync(processedImagePath)) {
          fs.unlinkSync(processedImagePath);
        }

        if (text && text.length > 0) {
          extractedData = parseExtractedText(text, targetCategory);
        } else {
          text = 'ไม่พบข้อความในรูปภาพ';
        }
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);
        text = 'เกิดข้อผิดพลาดในการสแกนรูปภาพ';
      }
    } else {
      text = 'รูปแบบไฟล์ไม่รองรับการสแกน';
    }

    const { publicUrl } = await uploadToLocalStorage(absoluteFilePath, originalName);

    const existingDoc = await prisma.document_scan.findFirst({
      where: {
        userId: userId,
        docCategory: targetCategory,
      },
    });

    let savedDoc;

    if (existingDoc) {
      if (existingDoc.fileUrl) {
        const oldCleanPath = existingDoc.fileUrl.replace(/^\/?uploads\//, '');
        const oldFilePath = path.join(process.cwd(), 'uploads', oldCleanPath);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (unlinkErr) {
            console.error('ไม่สามารถลบไฟล์เก่าได้:', unlinkErr);
          }
        }
      }

      savedDoc = await prisma.document_scan.update({
        where: { id: existingDoc.id },
        data: {
          fileUrl: publicUrl,
          extractedText: text,
          extractedData: extractedData || {},
          status: 'pending',
          updatedAt: new Date(),
        },
      });
    } else {
      savedDoc = await prisma.document_scan.create({
        data: {
          userId: userId,
          docCategory: targetCategory,
          fileUrl: publicUrl,
          extractedText: text,
          extractedData: extractedData || {},
          status: 'pending',
        },
      });
    }

    res.status(200).json({
      message: 'อัปโหลดและสแกนสำเร็จ',
      data: {
        id: savedDoc.id,
        userId: savedDoc.userId,
        name: savedDoc.docCategory,
        status: savedDoc.status,
        date: savedDoc.createdAt,
        fileUrl: savedDoc.fileUrl,
        extractedText: savedDoc.extractedText,
        extractedData: savedDoc.extractedData,
      },
    });
  } catch (error) {
    console.error('Scan Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ', error: error.message });
  } finally {
    if (absoluteFilePath && fs.existsSync(absoluteFilePath)) {
      try {
        fs.unlinkSync(absoluteFilePath);
      } catch (err) {
        console.error('Failed to cleanup temp upload file:', err);
      }
    }
  }
};

// =============================================================
// 2. ดึงประวัติการสแกนของนักศึกษาแต่ละคน
// =============================================================
exports.getUserDocumentHistory = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'userId ไม่ถูกต้อง' });
    }
    const documents = await prisma.document_scan.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงประวัติเอกสารได้', error: error.message });
  }
};

// =============================================================
// 3. ยกเลิกและลบเอกสาร
// =============================================================
exports.cancelDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID ไม่ถูกต้อง' });
    }
    const doc = await prisma.document_scan.findUnique({ where: { id: id } });

    if (!doc) return res.status(404).json({ message: 'ไม่พบเอกสารที่ต้องการลบ' });

    if (doc.fileUrl) {
      const cleanPath = doc.fileUrl.replace(/^\/?uploads\//, '');
      const filePath = path.join(process.cwd(), 'uploads', cleanPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.document_scan.delete({ where: { id: id } });
    res.json({ message: 'ลบเอกสารเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบเอกสารได้', error: error.message });
  }
};

// =============================================================
// 4. ดึงเอกสารทั้งหมด (สำหรับ Admin/อาจารย์)
// =============================================================
exports.getAllDocumentsForReview = async (req, res) => {
  try {
    const { status, search, docCategory } = req.query;
    const whereCondition = {};

    if (status && status !== 'all') whereCondition.status = status;
    if (docCategory) whereCondition.docCategory = docCategory;

    if (search) {
      whereCondition.OR = [
        { docCategory: { contains: search } },
        { extractedText: { contains: search } },
        { user: { fullName: { contains: search } } },
        { user: { studentId: { contains: search } } }
      ];
    }

    const documents = await prisma.document_scan.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, studentId: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedDocs = documents.map(doc => {
      const extracted = doc.extractedData || {};
      return {
        id: doc.id,
        userId: doc.userId,
        studentCode: doc.user?.studentId || extracted.studentId || doc.userId,
        studentName: doc.user?.fullName || extracted.fullName || 'ไม่ระบุชื่อ',
        docCategory: doc.docCategory,
        fileUrl: doc.fileUrl,
        extractedText: doc.extractedText,
        extractedData: doc.extractedData,
        status: doc.status,
        remark: doc.remark,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    });

    res.json(formattedDocs);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงรายการเอกสารทั้งหมดได้', error: error.message });
  }
};

// =============================================================
// 5. บันทึกผลการตรวจเอกสาร (Admin/อาจารย์)
// =============================================================
exports.reviewDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID ไม่ถูกต้อง' });
    }
    const { status, remark } = req.body;

    let finalStatus = status;
    if (status === 'ผ่าน' || status === 'approved') finalStatus = 'passed';
    if (status === 'ไม่ผ่าน' || status === 'rejected' || status === 'failed') finalStatus = 'failed';

    const updatedDoc = await prisma.document_scan.update({
      where: { id: id },
      data: { 
        status: finalStatus,
        remark: remark || null 
      }
    });

    res.json({ message: 'อัปเดตสถานะเอกสารสำเร็จ', data: updatedDoc });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถอัปเดตสถานะเอกสารได้', error: error.message });
  }
};