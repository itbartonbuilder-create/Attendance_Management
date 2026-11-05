import { jsPDF } from "jspdf";
import companyLogo from "../assets/logo.png"; 

export const convertNumberToWords = (num) => {
  if (num === null || num === undefined || num === "") {
    return "";
  }

  const number = Number(num);

  if (!Number.isFinite(number) || number < 0) {
    return "";
  }

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const twoDigits = (n) => {
    if (n < 20) {
      return a[n];
    }

    return (
      b[Math.floor(n / 10)] +
      (n % 10 !== 0 ? " " + a[n % 10] : "")
    );
  };

  const threeDigits = (n) => {
    if (n < 100) {
      return twoDigits(n);
    }

    return (
      a[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0
        ? " " + twoDigits(n % 100)
        : "")
    );
  };

  const indianNumberToWords = (n) => {
    if (n === 0) {
      return "Zero";
    }

    let str = "";

    if (Math.floor(n / 10000000) > 0) {
      str +=
        indianNumberToWords(Math.floor(n / 10000000)) +
        " Crore ";

      n %= 10000000;
    }

    if (Math.floor(n / 100000) > 0) {
      str +=
        twoDigits(Math.floor(n / 100000)) +
        " Lakh ";

      n %= 100000;
    }

    if (Math.floor(n / 1000) > 0) {
      str +=
        twoDigits(Math.floor(n / 1000)) +
        " Thousand ";

      n %= 1000;
    }

    if (Math.floor(n / 100) > 0) {
      str +=
        a[Math.floor(n / 100)] +
        " Hundred ";

      n %= 100;
    }

    if (n > 0) {
      str += twoDigits(n);
    }

    return str.trim();
  };

 
  const rupees = Math.floor(number);


  const paise = Math.round((number - rupees) * 100);

  let result = "";

  if (rupees > 0) {
    result = indianNumberToWords(rupees) + " Rupees";
  } else {
    result = "Zero Rupees";
  }

  
  if (paise > 0) {
    result +=
      " and " +
      indianNumberToWords(paise) +
      " Paise";
  }

  return result + " Only";
};
export const formatDateDMY = (date) => {
  if (!date) return "-";

  if (
    typeof date === "string" &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(date)
  ) {
    return date;
  }

  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

 
  const d = new Date(date);

  if (isNaN(d.getTime())) return date;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};
export const downloadSingleVoucherPDF = async (voucherData, contextData) => {
  const { currentDate, loggedInName, currentSite } = contextData;
  const doc = new jsPDF("p", "mm", "a4");
  
  const vNo = voucherData.voucherNo || "01";
 const vDate = voucherData.voucherDate
  ? formatDateDMY(voucherData.voucherDate)
  : currentDate;
  const vPayable = voucherData.payableTo || "-";
  const vParticulars = voucherData.particulars || "-";
  const vMode = voucherData.paymentMode || "Cash";
  const vAmount = voucherData.amount || "0";
  const vInWords = voucherData.amountInWords || convertNumberToWords(vAmount) || "Zero Rupees";
  const vCreator = voucherData.createdByName || loggedInName;
  const vSite = voucherData.site || currentSite;
  const imgUrl = voucherData.screenshotUrl || null;

  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, 10, 190, 265, 4, 4, "S");
  if (companyLogo) doc.addImage(companyLogo, "PNG", 15, 14, 15, 15);
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8); 
  doc.setTextColor(0, 0, 0); 
  doc.text("BARTONS BUILDERS LIMITED", 33, 23); 
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(80, 18, 45, 9, 4, 4, "FD"); 
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Project Site: ", 85, 23.5); 
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(`${vSite}`, 105, 23.5);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("Helvetica", "bold");
  doc.text("Date:", 145, 20);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${vDate}`, 170, 20);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Voucher No:", 145, 26);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(220, 38, 38);
  doc.text(`${vNo}`, 170, 26);
  doc.setDrawColor(241, 245, 249);
  doc.line(15, 36, 195, 36);
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Payment Voucher", 15, 46);
  doc.setFontSize(10);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Payable To:", 115, 46);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(137, 40, 58, 8, 2, 2, "S");
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${vPayable}`, 140, 45.5);
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 54, 180, 9, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 54, 180, 9, "S");
  doc.setFontSize(9);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Particulars / Description", 18, 60);
  doc.text("Payment Mode", 115, 60);
  doc.text("Amount (INR)", 165, 60);
  doc.rect(15, 63, 180, 22, "S");
  doc.line(110, 54, 110, 85);
  doc.line(160, 54, 160, 85);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const splitText = doc.splitTextToSize(vParticulars, 88);
  doc.text(splitText, 18, 70);
  doc.setFont("Helvetica", "bold");
  doc.text(`${vMode}`, 115, 70);
  doc.setFontSize(11);
  doc.setFont("Helvetica", "bold");
  doc.text(`${vAmount}`, 165, 70);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 92, 180, 10, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Amount in Words: ", 18, 98.5);
  doc.setFont("Helvetica", "bolditalic");
  doc.setTextColor(15, 23, 42);
  doc.text(`${vInWords}`, 48, 98.5);

  let nextY = 110;
  if (imgUrl) {
      const boxWidth = 100;
      const boxHeight = 60;
      const startX = 15;    
      const startY = nextY;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, nextY, boxWidth, boxHeight, 3, 3, "FD");
      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text(`Payment Proof / Receipt (${vMode})`, 18, nextY + 7);
      
      try {
        const img = new Image();
        img.src = imgUrl;
        await new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        const padding = 5; 
        const availableWidth = boxWidth - (padding * 2);
        const availableHeight = boxHeight - (padding * 2) - 10; 
        const imgRatio = img.width / img.height;
        const boxRatio = availableWidth / availableHeight;
        let finalWidth, finalHeight;

        if (imgRatio > boxRatio) {
            finalWidth = availableWidth;
            finalHeight = availableWidth / imgRatio;
        } else {
            finalHeight = availableHeight;
            finalWidth = availableHeight * imgRatio;
        }
        const xPos = startX + padding + (availableWidth - finalWidth) / 2;
        const yPos = startY + 10 + padding + (availableHeight - finalHeight) / 2;
        doc.addImage(imgUrl, "JPEG", xPos, yPos, finalWidth, finalHeight);
      } catch (e) {
        console.error("PDF Image Error:", e);
      }
      nextY += boxHeight + 8;
  } else {
      nextY += 25;
  }
  
  doc.setDrawColor(241, 245, 249);
  doc.line(15, nextY, 195, nextY);
  doc.setFontSize(8);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Note: This voucher is an official financial record valid for 30 days from issuance.", 15, nextY + 8);
  doc.setFontSize(10);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${vCreator}`, 150, nextY + 7, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Authorized Signatory", 150, nextY + 12, { align: "center" });
  
  doc.save(`Voucher_${vNo}_${vSite}.pdf`);
};
