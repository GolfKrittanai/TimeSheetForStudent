const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Tesseract = require('tesseract.js');
const path = require('path');
const { fromPath } = require("pdf2pic");

// ปรับแต่ง cleanValue ไม่ให้ลบเครื่องหมายจุด (.) ออก เพื่อรักษาจุดทศนิยมของเกรดเฉลี่ยไว้
function cleanValue(str) {
  if (!str) return '';
  return str
    .replace(/\(Company Info\)/gi, '') // ตัดข้อความหัวข้อ section ออก
    .replace(/[:_\-|"“”'’‘%]+/g, ' ')  // ลบเครื่องหมายพิเศษต่างๆ (เว้นจุด . ไว้)
    .replace(/\s+/g, ' ')              // ยุบ space ซ้ำ
    .trim();
}

function parseExtractedText(text, docCategory) {
  const extracted = {};
  if (!text) return extracted;

  const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const categoryLower = docCategory ? docCategory.toLowerCase() : '';

  if (categoryLower.includes("01")) {
    const nameMatch = cleanText.match(/(?:ชื่อ|นาย|นาง|นางสาว)\s*[:._\s]*([ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/);
    
    // ดักจับวันที่ทั้งรูปแบบภาษาไทย (เช่น 1 มิถุนายน 2566) และรูปแบบตัวเลข (เช่น 1/6/2566 หรือ 01/06/2023)
    const dateMatch = cleanText.match(/(?:วันที่|วันที่สมัคร|ลงวันที่)?\s*[:._\s]*([0-9]{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|[ก-๙.]+)\s+[0-9]{4})/i)
      || cleanText.match(/(?:วันที่|วันที่สมัคร|ลงวันที่)\s*[:._\s]*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-][0-9]{4})/i)
      || cleanText.match(/\b([0-9]{1,2}\s+[ก-๙.]+\s+[0-9]{4})\b/i);

    if (nameMatch) extracted.fullName = cleanValue(nameMatch[1]);
    if (dateMatch) extracted.signedDate = cleanValue(dateMatch[1]);
  }
  else if (categoryLower.includes("02-1")) {
    const parentMatch = cleanText.match(/ข้าพเจ้า\s*[:._\s]*([ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s+(?:พักอยู่|อยู่บ้านเลขที่|บ้านเลขที่|อาคาร|ตำบล|$))/);
    const studentMatch = cleanText.match(/ผู้ปกครอง\s*ของ\s*[:._\s]*([ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s+(?:รหัสนักศึกษา|ซึ่งเป็น|ระดับ|สาขา|$))/);
    const companyMatch = cleanText.match(/(?:บริษัท|สถานประกอบการ)\s*[:._\s]*([ก-๙a-zA-Z0-9\s.-]+?\s*(?:จำกัด)?)(?=\s+(?:ที่อยู่|ณ|เลขที่|$))/);
    const dateMatch = cleanText.match(/(?:วันที่|ลงวันที่)\s*[:._\s]*([\d/.\s-]+|[0-9]{1,2}\s+[ก-๙]+\s+[0-9]{4})/);

    if (parentMatch) extracted.parentName = cleanValue(parentMatch[1]);
    if (studentMatch) extracted.fullName = cleanValue(studentMatch[1]);
    if (companyMatch) extracted.companyName = cleanValue(companyMatch[1]);
    if (dateMatch) extracted.signedDate = cleanValue(dateMatch[1]);
  } 
  else if (categoryLower.includes("02-2")) {
    // 1. ดึงรหัสนักศึกษา
    const studentIdMatch = cleanText.match(/(?:รหัส\s*[\/:]*\s*ID|รหัสนักศึกษา|รหัส|ID)\s*[:._\s]*([0-9]{10})/i) 
      || cleanText.match(/\b(6[0-9]{9})\b/);
    if (studentIdMatch) extracted.studentId = cleanValue(studentIdMatch[1]);

    // 2. ดึงช่องทางติดต่อ (เบอร์โทรศัพท์ / โทรศัพท์ / มือถือ / โทร)
    const phoneMatch = cleanText.match(/(?:โทรศัพท์|โทร|มือถือ|ติดต่อ)\s*[:._\s]*([0-9\s-]{9,12})/i);
    if (phoneMatch) extracted.phone = cleanValue(phoneMatch[1]);

    // 3. ดึงชื่อสถานประกอบการ
    let companyMatch = cleanText.match(/(?:สถานประกอบการ|ชื่อสถานประกอบการ)\s*[:._\s]*((?:บร[ิื]?ษ[ัิ]?[ทธ]?\s*)?[ก-๙a-zA-Z0-9\s.-]+?(?:จำกัด|จํากัด|บจก\.|บจ\.))/i)
      || cleanText.match(/(?:สถานประกอบการ|ชื่อสถานประกอบการ)\s*[:._\s]*((?:บร[ิื]?ษ[ัิ]?[ทธ]?\s*)?.*?)(?=\s*(?:ต[ำํ]า?แหน่ง|ระยะเวลา|ประวัติ|3\.|4\.|ที่อยู่|$))/i);
    if (companyMatch) {
      let rawCompany = cleanValue(companyMatch[1]);
      rawCompany = rawCompany.replace(/^(?:สถานประกอบการ|ชื่อสถานประกอบการ)\s*[:._\s]*/i, '').trim();
      if (rawCompany) extracted.companyName = rawCompany;
    }

    // 4. ดึงตำแหน่งงาน
    const positionMatch = cleanText.match(/(?:ต[ำํ]า?แหน่งงาน(?:ท[ีื]?[่]?สมัคร)?|ต[ำํ]า?แหน่ง)\s*[:._\s]*([a-zA-Z0-9\s-]+?)(?=\s*(?:สถานประกอบการ|ระยะเวลา|ประวัติ|3\.|4\.|ที่อยู่|$))/i)
      || cleanText.match(/(?:ต[ำํ]า?แหน่งงาน(?:ท[ีื]?[่]?สมัคร)?|ต[ำํ]า?แหน่ง)\s*[:._\s]*(.*?)(?=\s*(?:สถานประกอบการ|ระยะเวลา|ประวัติ|3\.|4\.|ที่อยู่|$))/i);
    if (positionMatch) extracted.position = cleanValue(positionMatch[1]);

    // 5. ดึงวันที่ลงนาม
    const signedDateMatch = cleanText.match(/(?:วันที่|ลงวันที่)\s*[:._\s]*([0-9]{1,2}\s*[\/.-]\s*[0-9]{1,2}\s*[\/.-]\s*[0-9]{4})/i)
      || cleanText.match(/(?:วันที่|ลงวันที่)\s*[:._\s]*([0-9]{1,2}\s+[ก-๙]+\s+[0-9]{4})/i);
    if (signedDateMatch) {
      extracted.signedDate = cleanValue(signedDateMatch[1]);
    }
  }
  else if (categoryLower.includes("04")) {
    // 1. ดึงชื่อสถานประกอบการ
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

    // 2. ดึงตำแหน่งงาน
    const positionMatch = cleanText.match(/(?:ต[ำํ]า?แหน่งงาน(?:ท[ีื]?[่]?สมัคร)?|ต[ำํ]า?แหน่ง)\s*[:._\s]*(.*?)(?=\s*(?:ระยะเวลา|ท[ีื]?[่]?อย[ู]?[่]?สถาน|แผนท[ีื]?[่]?|$))/i);
    if (positionMatch) {
      extracted.position = cleanValue(positionMatch[1]);
    }

    // 3. ดึงระยะเวลา
    const periodMatch = cleanText.match(/ระยะเวลา\s*[:._\s]*(.*?)(?=\s*(?:ท[ีื]?[่]?อย[ู]?[่]?สถาน|ที่อยู่|แผนท[ีื]?[่]?|$))/i);
    if (periodMatch) {
      extracted.period = cleanValue(periodMatch[1]);
    }

    // 4. ดึงที่อยู่สถานที่ตั้ง
    const addressMatch = cleanText.match(/(?:ท[ีื]?[่]?อย[ู]?[่]?สถานประกอบการ|ท[ีื]?[่]?อย[ู]?[่]?สถานท[ีื]?[่]?ต[ั]?[้]?ง|ท[ีื]?[่]?อย[ู]?[่]?)\s*[:._\s]*(.*?)(?=\s*(?:แผนท[ีื]?[่]?|ลงช[ื]?[่]?อ|น[ั]กศ[ึ]กษา|ว[ั]นท[ีื]?[่]?|\*|$))/i);
    if (addressMatch) {
      let formattedAddress = cleanValue(addressMatch[1]);
      formattedAddress = formattedAddress
        .replace(/(^|\s)(?:ต|ตำบล|แขวง)(?=\s+[ก-๙])/g, '$1ต.')
        .replace(/(^|\s)(?:อ|อำเภอ|เขต)(?=\s+[ก-๙])/g, '$1อ.')
        .replace(/(^|\s)(?:จ|จังหวัด)(?=\s+[ก-๙])/g, '$1จ.')
        .replace(/\s+/g, ' ')
        .trim();

      extracted.address = formattedAddress;
    }

    // 5. ดึงวันที่เริ่มงาน
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
  // เงื่อนไขสำหรับเอกสารรายงานผลการศึกษา (BA Co-op 05 หรือ Transcript)
  else if (categoryLower.includes("05") || categoryLower.includes("รายงานผล") || categoryLower.includes("transcript")) {
    
    // 1. ดึงบรรทัดที่มีคำว่า "ชื่อ" หรือคำนำหน้า
    const lineMatch = text.split('\n').find(line => /(?:ชื่อ|นาย|นาง|นางสาว)/i.test(line));

    if (lineMatch) {
      // ตัดส่วนหัวข้อและส่วนหลังคำว่า "รหัส" ออก
      let cleanLine = lineMatch
        .replace(/^(?:ชื่อ\s*[:.]?|นาย|นาง|นางสาว)/i, '')
        .replace(/(?:รหัส|วัน|เดือน|ปี|สาขา|หลักสูตร|สถาบัน).*/i, '')
        .trim();

      // ลบตัวอักษรภาษาอังกฤษและตัวเลขขยะที่ OCR อ่านเพี้ยนออก (เก็บเฉพาะภาษาไทยและเว้นวรรค)
      cleanLine = cleanLine.replace(/[^ก-๙\s]/g, '').replace(/\s+/g, ' ').trim();

      if (cleanLine.length >= 3) {
        extracted.fullName = cleanLine;
      }
    }

    // Fallback: ดักจับรูปแบบคำภาษาไทย 2 คำติดกัน (ชื่อ + นามสกุล) โดยไม่เอาอังกฤษ
    if (!extracted.fullName) {
      const fallbackMatch = text.match(/(?:ชื่อ\s*[:.]?|นาย|นาง|นางสาว)\s*([ก-๙]{2,}\s+[ก-๙]{2,})/i);
      if (fallbackMatch) {
        extracted.fullName = fallbackMatch[1].trim();
      }
    }

    // 2. ดึงรหัสนักศึกษา (ตัวเลข 10 หลัก)
    const studentIdMatch = cleanText.match(/(?:รหัส\s*[:.]?|รหัสนักศึกษา|ID)\s*[:._\s]*([0-9]{10})/i) 
      || cleanText.match(/\b(6[0-9]{9})\b/);
    if (studentIdMatch) {
      extracted.studentId = cleanValue(studentIdMatch[1]);
    }

    // 3. ดึงเกรดเฉลี่ยสะสม / คะแนนเฉลี่ยสะสม
    const creditsMatch = cleanText.match(/(?:คะแนนเฉลี่ยสะสม|ผลการเรียนเฉลี่ยสะสม|เกรดเฉลี่ยสะสม|หน่วยกิตสะสม|GPA|GPAX)\s*[:._\s]*([0-9]+\.[0-9]{1,2})/i)
      || cleanText.match(/(?:สะสม|เฉลี่ย|รวม)\s*[:._\s=]*([0-9]+\.[0-9]{1,2})/i);
    
    if (creditsMatch) {
      extracted.totalCredits = cleanValue(creditsMatch[1]);
    }
  }

  return extracted;
}

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

    const relativePath = `uploads/${req.file.filename}`.replace(/\\/g, '/');
    const ext = path.extname(req.file.originalname).toLowerCase();
    const absoluteFilePath = path.resolve(req.file.path);

    let text = '';
    let status = 'pending';
    let extractedData = {};

    if (ext === '.pdf') {
  try {
    // กำหนดค่าการแปลง PDF หน้าแรกเป็นรูปภาพ PNG
    const options = {
      savedir: path.join(__dirname, '../../uploads'),
      filename: `${path.basename(req.file.filename, ext)}-page1`,
      imageFormat: "png",
      width: 1200,
      height: 1600
    };

    const convert = fromPath(absoluteFilePath, options);
    const convertResult = await convert(1); // แปลงหน้า 1

    // นำไฟล์รูปภาพที่ได้จาก PDF ไปให้ Tesseract สแกนต่อ
    const { data } = await Tesseract.recognize(convertResult.path, 'tha+eng');
    text = data.text ? data.text.trim() : '';

    if (text && text.length > 0) {
      extractedData = parseExtractedText(text, docCategory || 'BA Co-op 01');
      status = 'pending';
    } else {
      text = 'ไม่พบข้อความในไฟล์ PDF';
      status = 'failed';
    }
    }catch (pdfError) {
      console.error('PDF Conversion/OCR Error:', pdfError);
      text = 'เกิดข้อผิดพลาดในการแปลงและสแกนไฟล์ PDF';
      status = 'failed';
      }
    } 
    else if (['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)) {
      // โค้ดเดิมสำหรับรูปภาพ
      try {
        const { data } = await Tesseract.recognize(absoluteFilePath, 'tha+eng');
        text = data.text ? data.text.trim() : '';

        if (text && text.length > 0) {
          extractedData = parseExtractedText(text, docCategory || 'BA Co-op 01');
        } else {
          text = 'ไม่พบข้อความในรูปภาพ';
          status = 'failed';
        }
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);
        text = 'เกิดข้อผิดพลาดในการสแกนรูปภาพ';
        status = 'failed';
      }
    } else {
      text = 'รูปแบบไฟล์ไม่รองรับการสแกน';
      status = 'failed';
    }

    const newDoc = await prisma.document_scan.create({
      data: {
        userId: userId,
        docCategory: docCategory || 'BA Co-op 01',
        fileUrl: relativePath,
        extractedText: text,
        status: status,
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
        extractedData: extractedData,
      },
    });
  } catch (error) {
    console.error('Scan Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ', error: error.message });
  }
};

exports.getUserDocumentHistory = async (req, res) => {
  try {
    const userId = req.user?.id ? parseInt(req.user.id) : parseInt(req.params.userId);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: 'ไม่พบข้อมูลนักศึกษา (userId)' });
    }

    const history = await prisma.document_scan.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const historyWithParsedData = history.map((doc) => ({
      ...doc,
      extractedData: parseExtractedText(doc.extractedText, doc.docCategory),
    }));

    res.json(historyWithParsedData);
  } catch (error) {
    console.error('Fetch History Error:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลประวัติได้' });
  }
};