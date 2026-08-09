const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Tesseract = require('tesseract.js');
const path = require('path');

// ฟังก์ชันช่วยดึงค่าหลัง label โดยรวม class ตัวอักษรไทย/อังกฤษ/ตัวเลขไว้ด้วยกัน
// (ของเดิมใช้ (?:[a-zA-Z0-9\s_-]+|[ก-๙\s]+?) แยก class ภาษาไทยกับอังกฤษ/ตัวเลขออกจากกัน
//  ทำให้ค่าที่มีทั้งไทยและอังกฤษปนกัน หรือค่าที่ OCR สลับ format ไม่สามารถจับได้ครบ)
//
// บั๊กสำคัญที่พบเพิ่ม: เมื่อ OCR ไม่มี ":" คั่นระหว่าง label กับค่า (พบบ่อยมากในเอกสารจริง)
// label แบบสั้น/ทั่วไป เช่น "สถานประกอบการ" จะไปแมตช์ผิดตำแหน่ง เพราะเป็นคำย่อยที่ซ้อนอยู่ท้ายคำว่า
// "ข้อมูลสถานประกอบการ" (หัวข้อ section) ซึ่งอยู่ก่อนหน้า label จริง ทำให้ค่าที่ดึงมาได้ปนหัวข้อ/label เข้าไปด้วย
// หรือบางกรณีแมตช์ไม่สำเร็จเลย -> แก้ด้วย negative lookbehind (?<![ก-๙]) กันไม่ให้ label ไปจับกลางคำไทยอื่น
function extractField(cleanText, labels, stopLabels) {
  const labelPattern = labels.join('|');
  // อักขระที่อนุญาตในค่า: ไทย, อังกฤษ, ตัวเลข, และสัญลักษณ์ที่พบได้ในชื่อบริษัท/ตำแหน่ง/ที่อยู่
  const valueClass = 'ก-๙a-zA-Z0-9()"\'\\/&,._\\s-';
  const stopPattern = stopLabels && stopLabels.length ? stopLabels.join('|') : null;
  const re = stopPattern
    ? new RegExp(`(?<![ก-๙])(?:${labelPattern})\\s*[:._\\s]*([${valueClass}]+?)(?=\\s*(?:${stopPattern}|$))`, 'i')
    : new RegExp(`(?<![ก-๙])(?:${labelPattern})\\s*[:._\\s]*([${valueClass}]+)$`, 'i');
  const m = cleanText.match(re);
  if (!m) return null;
  // ตัดอักขระขยะ/เครื่องหมายคำพูดที่ OCR อ่านหลุดมาติดหัวท้ายค่า (เช่น " ที่ไม่มีคู่)
  const val = m[1]
    .trim()
    .replace(/\s{2,}/g, ' ')
    .replace(/^["'“”.,-]+|["'“”.,-]+$/g, '')
    .trim();
  return val ? val : null;
}

// ฟังก์ชันช่วยดึงข้อมูลจากข้อความดิบตามประเภทเอกสาร
function parseExtractedText(text, docCategory) {
  const extracted = {};
  if (!text) return extracted;

  // คลีนอักขระขยะ และเปลี่ยนบรรทัดใหม่/ช่องว่างซ้ำให้เป็น Space เดียว
  const cleanText = text
    .replace(/[\r\n]+/g, ' ')
    .replace(/[_|]+/g, ' ')
    .replace(/::+/g, ':')
    .replace(/\s+/g, ' ');

  const categoryLower = docCategory ? docCategory.toLowerCase() : '';

  if (categoryLower.includes("01")) {
    const nameMatch = cleanText.match(/(?:ชื่อ|นาย|นาง|นางสาว)\s*[:._\s]*([ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+)/);
    const dateMatch = cleanText.match(/(?:วันที่|วันที่สมัคร)\s*[:._\s]*([\d/.\s-]+|[0-9]{1,2}\s+[ก-๙]+\s+[0-9]{4})/);
    
    if (nameMatch) extracted.fullName = nameMatch[1].trim();
    if (dateMatch) extracted.signedDate = dateMatch[1].trim();
  } 
  else if (categoryLower.includes("02-1")) {
    const parentMatch = cleanText.match(/ข้าพเจ้า\s*[:._\s]*([ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s+(?:พักอยู่|อยู่บ้านเลขที่|บ้านเลขที่|อาคาร|ตำบล|$))/);
    const studentMatch = cleanText.match(/ผู้ปกครอง\s*ของ\s*[:._\s]*([ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)+?)(?=\s+(?:รหัสนักศึกษา|ซึ่งเป็น|ระดับ|สาขา|$))/);
    const companyMatch = cleanText.match(/(?:บริษัท|สถานประกอบการ)\s*[:._\s]*([ก-๙a-zA-Z0-9\s.-]+?\s*(?:จำกัด)?)(?=\s+(?:ที่อยู่|ณ|เลขที่|$))/);
    const dateMatch = cleanText.match(/(?:วันที่|ลงวันที่)\s*[:._\s]*([\d/.\s-]+|[0-9]{1,2}\s+[ก-๙]+\s+[0-9]{4})/);

    if (parentMatch) extracted.parentName = parentMatch[1].trim();
    if (studentMatch) extracted.fullName = studentMatch[1].trim();
    if (companyMatch) extracted.companyName = companyMatch[1].trim();
    if (dateMatch) extracted.signedDate = dateMatch[1].trim();
  } 
  // BA Co-op 02-2 (ปรับปรุง Regex เพิ่มเติมให้จับคำได้ยืดหยุ่นขึ้น)
  else if (categoryLower.includes("02-2")) {
    const studentIdMatch = cleanText.match(/(?:รหัส\s*\/\s*ID|รหัสนักศึกษา|รหัส|ID)\s*[:._\s]*([0-9]{10})/i) || cleanText.match(/\b(6[0-9]{9})\b/);
    const phoneMatch = cleanText.match(/(?:โทรศัพท์|โทร|มือถือ)\s*[:._\s]*([0-9\s-]{9,12})/);
    
    // ดึงสถานประกอบการ (รองรับ label หลายแบบ + หยุดก่อนถึง field ถัดไป)
    const companyMatch = extractField(
      cleanText,
      ['ชื่อสถานประกอบการ', 'สถานประกอบการ', 'สถานที่ฝึกงาน', 'บริษัท'],
      ['เบอร์โทรศัพท์', 'โทรศัพท์', 'โทร', 'ที่อยู่', 'ตำแหน่งงานที่สมัคร', 'ตำแหน่งงาน', 'ตำแหน่ง', 'ระยะเวลา', 'ประวัติ', '3\\.', '4\\.', 'ลงชื่อ']
    );

    // ดึงตำแหน่งงาน
    const positionMatch = extractField(
      cleanText,
      ['ตำแหน่งงานที่สมัคร', 'ตำแหน่งที่สมัคร', 'ตำแหน่งงาน', 'ตำแหน่ง'],
      ['สถานประกอบการ', 'ลักษณะงาน', 'ระยะเวลา', 'ประวัติ', 'อัตรา', 'เงินเดือน', 'ลงชื่อ', '4\\.', '5\\.']
    );

    // ดึงวันที่ลงนาม (รองรับรูปแบบ 08 / 09 / 2567 หรือ วันที่ 8 กันยายน 2567)
    const signedDateMatch = cleanText.match(/(?:วันที่|ลงวันที่)\s*[:._\s]*([0-9]{1,2}\s*[\/.-]\s*[0-9]{1,2}\s*[\/.-]\s*[0-9]{4})/i) ||
                             cleanText.match(/(?:วันที่|ลงวันที่)\s*[:._\s]*([0-9]{1,2}\s+[ก-๙]+\s+[0-9]{4})/i);

    if (studentIdMatch) extracted.studentId = studentIdMatch[1].trim();
    if (phoneMatch) extracted.phone = phoneMatch[1].trim();
    if (companyMatch) extracted.companyName = companyMatch;
    if (positionMatch) extracted.position = positionMatch;
    if (signedDateMatch) extracted.signedDate = signedDateMatch[1].trim();
  } 
  // BA Co-op 04 / 04-1
  else if (categoryLower.includes("04")) {
    const companyMatch = extractField(
      cleanText,
      ['ชื่อสถานประกอบการ', 'สถานประกอบการ', 'บริษัท'],
      ['ตำแหน่งงานที่สมัคร', 'ตำแหน่งงาน', 'ตำแหน่ง', 'ระยะเวลา', 'ที่อยู่', '2\\.', '3\\.']
    );

    const positionMatch = extractField(
      cleanText,
      ['ตำแหน่งงานที่สมัคร', 'ตำแหน่งที่สมัคร', 'ตำแหน่งงาน', 'ตำแหน่ง'],
      ['ระยะเวลา', 'ที่อยู่', 'แผนที่', '3\\.', '4\\.']
    );

    const periodMatch = cleanText.match(/ระยะเวลา\s*[:._\s]*(\d{4}-\d{2}-\d{2}\s+ถึง\s+\d{4}-\d{2}-\d{2})/i) ||
                        cleanText.match(/ระยะเวลา\s*[:._\s]*([\d/.\s-]+(?:ถึง|-)\s*[\d/.\s-]+)/i);

    const addressMatch = extractField(
      cleanText,
      ['ที่อยู่สถานประกอบการ', 'ที่อยู่สถานที่ตั้ง', 'ที่อยู่'],
      ['แผนที่', 'ลงชื่อ', 'วันที่', '3\\.', '4\\.']
    );

    if (companyMatch) extracted.companyName = companyMatch;
    if (positionMatch) extracted.position = positionMatch;
    if (periodMatch) {
      extracted.period = periodMatch[1].trim();
      // วันที่เริ่มงาน = วันแรกของช่วงระยะเวลา (รองรับทั้ง yyyy-mm-dd และ dd/mm/yyyy)
      const firstDateMatch = extracted.period.match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s*[\/.-]\s*\d{1,2}\s*[\/.-]\s*\d{4}/);
      if (firstDateMatch) extracted.startDate = firstDateMatch[0].trim();
    }
    if (addressMatch) extracted.address = addressMatch;
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
      text = 'เอกสาร PDF (บันทึกเข้าระบบเรียบร้อย)';
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)) {
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