const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const pdfPoppler = require('pdf-poppler');
const sharp = require('sharp'); // นำเข้า sharp สำหรับทำ Image Pre-processing

// =============================================================
// ฟังก์ชัน Preprocessing รูปภาพ
// =============================================================
async function preprocessImage(inputPath) {
  try {
    const outputPath = inputPath.replace(/\.(png|jpg|jpeg|webp|bmp)$/i, '_processed.png');

    await sharp(inputPath)
      .grayscale()                  // แปลงเป็นภาพขาวดำ
      .normalize()                  // ปรับ Contrast สมดุลแสง
      .sharpen()                    // เพิ่มความคมชัดของตัวอักษร
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error('Image Preprocessing Error (Fallback to original):', error);
    return inputPath; // หากประมวลผลล้มเหลว ให้ใช้ไฟล์เดิมแทน
  }
}

// ฟังก์ชันทำความสะอาดข้อความขยะที่ติดมาจาก OCR
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

  // -------------------------------------------------------------
  // 1. BA Co-op 01 (เอกสารติดต่อ/ขออนุญาต)
  // -------------------------------------------------------------
  if (categoryLower.includes("01")) {
    const nameMatch = cleanText.match(/(?:เรื่อง|เรียน|ของ|นักศึกษา|ชื่อ)\s*[:\.]*\s*((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/i) ||
                      cleanText.match(/((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/i);
    
    const dateMatch = cleanText.match(/วันที่\s*[:\.]*\s*([0-9]{1,2}[\s\/\.-]+(?:[0-9]{1,2}|[ก-๙]+)[\s\/\.-]+[0-9]{2,4})/i);

    if (nameMatch) extracted.fullName = cleanValue(nameMatch[1]);
    if (dateMatch) extracted.signedDate = cleanValue(dateMatch[1]);
  }

  // -------------------------------------------------------------
  // 2. BA Co-op 02-1 (ยินยอมจากผู้ปกครอง)
  // -------------------------------------------------------------
  else if (categoryLower.includes("02-1")) {
  const parentMatch = cleanText.match(/ข้าพเจ้า\s+([ก-๙a-zA-Z\.\-]+(?:\s+[ก-๙a-zA-Z\.\-]+)+?)(?=\s*(?:พักอยู่|บ้านเลขที่|เกี่ยวข้องเป็น|ผู้ปกครอง|ของ|$))/i) ||
                      cleanText.match(/ผู้ปกครอง\s*(?:ของ)?\s*([ก-๙a-zA-Z\.\-]+(?:\s+[ก-๙a-zA-Z\.\-]+)+?)(?=\s*(?:รหัสนักศึกษา|ซึ่งเป็นนักศึกษา|สังกัด|ระดับ|$))/i);
  
  const studentMatch = cleanText.match(/(?:ผู้ปกครอง\s*ของ|นักศึกษา|นาย|นาง|นางสาว)\s*((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s*(?:รหัส|เข้าฝึก|สังกัด|เรียน|คณบดี|สาขา|$))/i) ||
                       cleanText.match(/((?:นาย|นาง|นางสาว)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s*(?:รหัสนักศึกษา|ซึ่งเป็นนักศึกษา))/i);
  
  const companyMatch = cleanText.match(/(?:ณ|สถานประกอบการ|บริษัท)\s+([ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|มหาชน|เฮ้าส์|เฮาส์)(?:\s+จำกัด|\s+จํากัด)?)/i) ||
                       cleanText.match(/(บริษัท\s+[ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|มหาชน)?)/i);  const dateMatch = cleanText.match(/วันที่\s*[:\.]*\s*([0-9]{1,2}[\s\/\.-]+(?:[0-9]{1,2}|[ก-๙]+)[\s\/\.-]+[0-9]{2,4})/i);

  if (parentMatch) extracted.parentName = cleanValue(parentMatch[1]);
  if (studentMatch) extracted.fullName = cleanValue(studentMatch[1]);
  
  if (companyMatch) {
    let rawComp = cleanValue(companyMatch[1] || companyMatch[0]);
    // ปรับแก้ไข: ตรวจสอบและซ่อมคำว่าบริษัทให้เหลือเพียง 1 คำ
    rawComp = rawComp.replace(/^(บริษัท\s*)+/i, 'บริษัท ').trim();
    
    if (!/จำกัด|จํากัด/.test(rawComp) && /จำกัด|จํากัด/.test(cleanText)) {
      rawComp += " จำกัด";
    }
    extracted.companyName = rawComp;
  }

    if (dateMatch) extracted.signedDate = cleanValue(dateMatch[1]);
  }

  // -------------------------------------------------------------
  // 3. BA Co-op 02-2 (ใบสมัครงานสหกิจ)
  // -------------------------------------------------------------
  else if (categoryLower.includes("02-2")) {
  const nameMatch = cleanText.match(/(?:ชื่อ\s*-\s*สกุล|ชื่อ\s*\/\s*Name|ชื่อ)\s*[:\.]*\s*((?:นาย|นาง|นางสาว)?\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s*(?:รหัส|สาขาวิชา|GPA|1\.|2\.|$))/i);
  const studentIdMatch = cleanText.match(/(?:รหัส|รหัสนักศึกษา|ID)\s*[:\.]*\s*([0-9]{10})/i) || cleanText.match(/\b(6[0-9]{9})\b/);
  const phoneMatch = cleanText.match(/(?:โทรศัพท์|โทร|มือถือ|ติดต่อ)\s*[:\.]*\s*([0-9\s-]{9,12})/i);
  
  const companyMatch = cleanText.match(/(?:สถานประกอบการ|ชื่อสถานประกอบการ)\s*[:\.]*\s*([ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|เฮ้าส์|เฮาส์)?)(?=\s*(?:BN|B|ระยะเวลา|ตำแหน่ง|ประวัติ|3\.|$))/i) ||
                       cleanText.match(/(บริษัท\s+[ก-๙a-zA-Z0-9\s.-]+?\s*(?:จำกัด|จํากัด|เฮ้าส์|เฮาส์)?)/i);
  
  // ปรับแก้ไข: เพิ่มข้อความหยุดดักจับเมื่อเจอ "สถานประกอบการ", "บริษัท", "ระยะเวลา", "ประวัติ"
  const positionMatch = cleanText.match(/(?:ต[ำํ]า?แหน่งงาน(?:ท[ีื]?[่]?สมัคร)?|ต[ำํ]า?แหน่ง)\s*[:._\s]*(.*?)(?=\s*(?:สถานประกอบการ|บริษัท|ระยะเวลา|ท[ีื]?[่]?อย[ู]?[่]?สถาน|แผนท[ีื]?[่]|ประวัติ|$))/i);  const dateMatch = cleanText.match(/วันที่\s*[:\.]*\s*([0-9]{1,2}[\s\/\.-]+(?:[0-9]{1,2}|[ก-๙]+)[\s\/\.-]+[0-9]{2,4})/i);

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

  // -------------------------------------------------------------
  // 4. BA Co-op 04 (รายละเอียดที่พัก)
  // -------------------------------------------------------------
  else if (categoryLower.includes("04")) {
    let companyMatch = cleanText.match(/(?:ชื่อสถานประกอบการ|สถานประกอบการ)\s*[:._\s]*((?:บร[ิื]?ษ[ัิ]?[ทธ]?\s*)?[ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|บจ\.))/i)
      || cleanText.match(/((?:บร[ิื]?ษ[ัิ]?[ทธ]?\s+)?[ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|บจ\.))/i);

    if (!companyMatch) {
      companyMatch = cleanText.match(/(?:ชื่อสถานประกอบการ|สถานประกอบการ)\s*[:._\s]*((?:บร[ิื]?ษ[ัิ]?[ทธ]?\s*)?.*?)(?=\s*(?:ต[ำํ]า?แหน่ง|ระยะเวลา|ท[ีื]?[่]?อย[ู]?[่]?|เลขที่|\d+\/\d+|$))/i);
    }

    if (companyMatch) {
      let rawCompany = cleanValue(companyMatch[1] || companyMatch[0]);
      rawCompany = rawCompany
        .replace(/^(?:ชื่อสถานประกอบการ|สถานประกอบการ)\s*[:._\s]*/i, '')
        .trim();

      if (rawCompany) {
        extracted.companyName = rawCompany;
      }
    }

    const positionMatch = cleanText.match(/(?:ต[ำํ]า?แหน่งงาน(?:ท[ีื]?[่]?สมัคร)?|ต[ำํ]า?แหน่ง)\s*[:._\s]*(.*?)(?=\s*(?:ระยะเวลา|ท[ีื]?[่]?อย[ู]?[่]?สถาน|แผนท[ีื]?[่]?|$))/i);
    if (positionMatch) {
      extracted.position = cleanValue(positionMatch[1]);
    }

    const periodMatch = cleanText.match(/ระยะเวลา\s*[:._\s]*(.*?)(?=\s*(?:ท[ีื]?[่]?อย[ู]?[่]?สถาน|ที่อยู่|แผนท[ีื]?[่]?|$))/i);
    if (periodMatch) {
      extracted.period = cleanValue(periodMatch[1]);
    }

    const addressMatch = cleanText.match(/(?:ท[ีื]?[่]?อย[ู]?[่]?สถานประกอบการ|ท[ีื]?[่]?อย[ู]?[่]?สถานท[ีื]?[่]?ต[ั]?[้]?ง|ท[ีื]?[่]?อย[ู]?[่]?)\s*[:._\s]*(.*?)(?=\s*(?:แผนท[ีื]?[่]?|ลงช[ื]?[่]?อ|น[ั]กศ[ึ]กษา|ว[ั]นท[ีื]?[่]?|\*|$))/i);
    if (addressMatch) {
      let formattedAddress = cleanValue(addressMatch[1]);
      formattedAddress = formattedAddress
        .replace(/(^|\s)(?:ต|ตำบล|แขวง)(?=\s+[ก-๙])/g, '$1ต.')
        .replace(/(^|\s)(?:อ|อำเภอ|เขต)(?=\s+[ก-๙])/g, '$1อ.')
        .replace(/(^|\s)(?:จ|จังหวัด)(?=\s+[ก-๙])/g, '$1จ.')
        .replace(/\s+/g, ' ')
        // ปรับแก้ไข: ลบสัญลักษณ์พิเศษ ขยะ หรือ .@ ที่อยู่ท้ายสตริงออก
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

  // -------------------------------------------------------------
  // 5. BA Co-op 05 (ผลการศึกษา / Transcript)
  // -------------------------------------------------------------
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

  return extracted;
}

// 1. อัปโหลดและสแกนเอกสาร
exports.scanAndSaveDocument = async (req, res) => {
  try {
    const userId = req.user?.id ? parseInt(req.user.id) : parseInt(req.body.userId);
    const { docCategory } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: 'ไม่พบข้อมูลนักศึกษา (userId)' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดไฟล์' });
    }

    let relativePath = `uploads/${req.file.filename}`.replace(/\\/g, '/');
    const ext = path.extname(req.file.originalname).toLowerCase();
    const absoluteFilePath = path.resolve(req.file.path);

    let text = '';
    let extractedData = {};

    if (ext === '.pdf') {
      try {
        const uploadFolder = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadFolder)) {
          fs.mkdirSync(uploadFolder, { recursive: true });
        }

        const outputPrefix = `${path.basename(req.file.filename, ext)}-page`;
        
        const popplerOptions = {
          format: 'png',
          out_dir: uploadFolder,
          out_prefix: outputPrefix,
          page: 1,
          scale: 1200
        };

        await pdfPoppler.convert(absoluteFilePath, popplerOptions);
        const generatedFileName = `${outputPrefix}-1.png`;
        const convertedImagePath = path.join(uploadFolder, generatedFileName);

        if (fs.existsSync(convertedImagePath)) {
          relativePath = `uploads/${generatedFileName}`.replace(/\\/g, '/');
          
          const processedImagePath = await preprocessImage(convertedImagePath);
          const { data } = await Tesseract.recognize(processedImagePath, 'tha+eng');
          text = data.text ? data.text.trim() : '';

          if (processedImagePath !== convertedImagePath && fs.existsSync(processedImagePath)) {
            fs.unlinkSync(processedImagePath);
          }
        }

        if (text && text.length > 0) {
          extractedData = parseExtractedText(text, docCategory || 'BA Co-op 01');
        } else {
          text = 'สแกนข้อความในไฟล์ PDF ไม่สมบูรณ์';
        }
      } catch (pdfError) {
        console.error('PDF Conversion/OCR Error:', pdfError);
        text = 'เกิดข้อผิดพลาดในการแปลงและสแกนไฟล์ PDF';
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
          extractedData = parseExtractedText(text, docCategory || 'BA Co-op 01');
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

    // บันทึก extractedData (JSON) ลงใน Prisma DB
    const newDoc = await prisma.document_scan.create({
      data: {
        userId: userId,
        docCategory: docCategory || 'BA Co-op 01',
        fileUrl: relativePath,
        extractedText: text,
        extractedData: extractedData,
        status: 'pending',
      },
    });

    res.status(201).json({
      message: 'อัปโหลดและสแกนสำเร็จ',
      data: {
        id: newDoc.id,
        userId: newDoc.userId,
        name: newDoc.docCategory,
        status: newDoc.status,
        date: newDoc.createdAt,
        fileUrl: newDoc.fileUrl,
        extractedText: newDoc.extractedText,
        extractedData: newDoc.extractedData,
      },
    });
  } catch (error) {
    console.error('Scan Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ', error: error.message });
  }
};

// 2. ดึงประวัติการสแกนของนักศึกษาแต่ละคน
exports.getUserDocumentHistory = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const documents = await prisma.document_scan.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงประวัติเอกสารได้', error: error.message });
  }
};

// 3. ยกเลิกและลบเอกสาร
exports.cancelDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const doc = await prisma.document_scan.findUnique({ where: { id: id } });

    if (!doc) {
      return res.status(404).json({ message: 'ไม่พบเอกสารที่ต้องการลบ' });
    }

    if (doc.fileUrl) {
      const filePath = path.join(__dirname, '..', doc.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.document_scan.delete({ where: { id: id } });
    res.json({ message: 'ลบเอกสารเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบเอกสารได้', error: error.message });
  }
};

// 4. ดึงเอกสารทั้งหมด (สำหรับ Admin/อาจารย์)
exports.getAllDocumentsForReview = async (req, res) => {
  try {
    const documents = await prisma.document_scan.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงรายการเอกสารทั้งหมดได้', error: error.message });
  }
};

// 5. บันทึกผลการตรวจเอกสาร
exports.reviewDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const updatedDoc = await prisma.document_scan.update({
      where: { id: id },
      data: { status: status }
    });

    res.json({ message: 'อัปเดตสถานะเอกสารสำเร็จ', data: updatedDoc });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถอัปเดตสถานะเอกสารได้', error: error.message });
  }
};