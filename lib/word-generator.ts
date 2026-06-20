import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import ImageModule from 'docxtemplater-image-module-free';
import { formatCFA, formatDate, calculateInvoice, numberToWordsCFA, TVA_RATE, injectSectionSubtotals } from '@/lib/utils';

export const generateWordInvoice = async (
  templateBase64: string,
  invoice: any,
  client: any,
  settings: any,
  fileHandle?: any,
  filename?: string
) => {
  try {
    // 1. Convert base64 or fetch from URL to binary string
    let bytes: Uint8Array;
    
    if (templateBase64.startsWith('http')) {
      const response = await fetch(templateBase64);
      const arrayBuffer = await response.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
    } else {
      const base64Data = templateBase64.split(',')[1] || templateBase64;
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    }

    // 2. Load zip
    const zip = new PizZip(bytes.buffer as ArrayBuffer);

    // 2.5 Apply dynamic theme color to the template xml BEFORE initializing Docxtemplater
    try {
      const themeColorHex = (settings.themeColor || '#2D8B6F').replace('#', '').toUpperCase();
      const defaultHex = '2D8B6F';
      if (themeColorHex !== defaultHex) {
        // Read the internal XML of the word document
        let documentXml = zip.file("word/document.xml")?.asText();
        if (documentXml) {
          // Replace all occurrences of the default green hex with the user's selected hex
          const colorRegex = new RegExp(defaultHex, 'gi');
          documentXml = documentXml.replace(colorRegex, themeColorHex);
          // Put the modified XML back into the zip
          zip.file("word/document.xml", documentXml);
        }
      }
    } catch (colorError) {
      console.warn("Could not apply dynamic color to word template", colorError);
    }

    // 2.8 Prepare logo size and image module
    let processedLogo = settings.logo;
    if (settings.logo && settings.logo.startsWith('http')) {
      try {
        const logoUrl = `${settings.logo}${settings.logo.includes('?') ? '&' : '?'}cors=1`;
        const res = await fetch(logoUrl);
        const blob = await res.blob();
        processedLogo = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch(e) {
        console.warn("Failed to fetch logo directly", e);
      }
    }

    let logoSize = [0, 0]; // default size when no logo is present
    if (processedLogo && processedLogo.startsWith('data:image')) {
      logoSize = await new Promise<[number, number]>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const maxW = 400; // Increased to test 4K/high-res rendering
          const maxH = 200;
          let w = img.width;
          let h = img.height;
          if (w > maxW) {
            h = (h * maxW) / w;
            w = maxW;
          }
          if (h > maxH) {
            w = (w * maxH) / h;
            h = maxH;
          }
          resolve([Math.round(w), Math.round(h)]);
        };
        img.onerror = () => resolve([150, 50]);
        img.src = processedLogo;
      });
    }

    const imageOptions = {
      centered: false,
      getImage: function (tagValue: string, tagName: string) {
        if (tagValue && tagValue.startsWith('data:image')) {
          const stringBase64 = tagValue.split('base64,')[1];
          const binaryString = window.atob(stringBase64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes.buffer;
        }
        // Fallback transparent 1x1 pixel if no image
        const transparent1x1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const binaryString = window.atob(transparent1x1);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      },
      getSize: function (img: any, tagValue: string, tagName: string) {
        if (!tagValue || tagValue === "undefined" || tagValue === "null" || tagValue === "") {
          return [1, 1]; // docxtemplater crashes if size is 0, so we use 1x1 pixel
        }
        if (tagName === 'logo' || tagName === 'companyLogo') {
          return logoSize[0] === 0 && logoSize[1] === 0 ? [150, 50] : logoSize;
        }
        return [100, 100];
      }
    };
    const imageModule = new ImageModule(imageOptions);

    // 3. Initialize document
    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
      paragraphLoop: true,
      linebreaks: true,
      nullGetter() {
        return ""; // Prevent "undefined" from showing in the document
      }
    });

    // 4. Prepare data
    const calculations = calculateInvoice(invoice.lines, invoice.metadata);
    const linesWithSubtotals = injectSectionSubtotals(invoice.lines);
    const formattedLines = linesWithSubtotals.map((line: any) => {
      const isSection = line.type === 'section';
      const isDiscountLine = line.type === 'discount';
      const isItem = line.type === 'item' || line.type === 'text';

      let formattedUnitPrice = '';
      let formattedTotal = '';
      let quantityDisplay = '';
      let rawQuantity: any = line.quantity;
      let rawUnitPrice: any = line.unitPrice;

      let descriptionDisplay = line.description || '';
      let isSubtotalLine = descriptionDisplay.toLowerCase().includes('sous-total') || descriptionDisplay.toLowerCase().includes('sous total');
      
      if (isSection) {
        // La section n'a pas de prix ni de quantité
        formattedUnitPrice = '';
        formattedTotal = '';
        quantityDisplay = '';
        rawQuantity = '';
        rawUnitPrice = '';
        descriptionDisplay = '[[SEC]]' + descriptionDisplay.toUpperCase() + '[[ENDSEC]]';
      } else if (isDiscountLine) {
        // Remise
        formattedUnitPrice = formatCFA(line.unitPrice || 0);
        formattedTotal = '- ' + formatCFA(line.unitPrice || 0);
        quantityDisplay = '';
      } else if (isSubtotalLine || line.type === 'subtotal') {
        formattedUnitPrice = '';
        formattedTotal = formatCFA(line.unitPrice || 0);
        descriptionDisplay = '[[SUB]]' + descriptionDisplay + '[[ENDSUB]]';
      } else {
        // Article normal
        formattedUnitPrice = line.isForfait ? 'FF' : formatCFA(line.unitPrice || 0);
        formattedTotal = line.isForfait ? formatCFA(line.unitPrice || 0) : formatCFA((line.quantity || 0) * (line.unitPrice || 0));
        quantityDisplay = line.unit ? `${line.quantity} ${line.unit}` : String(line.quantity || '');
      }

      return {
        description: descriptionDisplay,
        isSection,
        isDiscount: isDiscountLine,
        isItem,
        formattedUnitPrice,
        formattedTotal,
        serviceDeliverables: line.deliverables || '',
        quantityDisplay,
        quantity: rawQuantity,
        unitPrice: rawUnitPrice
      };
    });

    const licenseLines = formattedLines.filter((l: any) => l.category === 'license');
    const supportLines = formattedLines.filter((l: any) => l.category === 'support');
    const serviceLines = formattedLines.filter((l: any) => l.category === 'service');

    const licensesSubtotalAmount = licenseLines.reduce((acc: number, l: any) => acc + (l.isForfait ? l.unitPrice : l.quantity * l.unitPrice), 0);
    const supportSubtotalAmount = supportLines.reduce((acc: number, l: any) => acc + (l.isForfait ? l.unitPrice : l.quantity * l.unitPrice), 0);
    const servicesSubtotalAmount = serviceLines.reduce((acc: number, l: any) => acc + (l.isForfait ? l.unitPrice : l.quantity * l.unitPrice), 0);

    const actualTvaRate = invoice.metadata?.tvaRate !== undefined ? Number(invoice.metadata.tvaRate) : (TVA_RATE * 100);
    const formattedTvaRate = actualTvaRate.toString().replace('.', ',');

    const data = {
      // Invoice infos
      invoiceId: invoice.number || invoice.id,
      proformaNumber: invoice.number || invoice.id,
      issueDate: formatDate(invoice.issueDate),
      dueDate: formatDate(invoice.dueDate),
      
      // Client infos
      clientName: client?.name || '',
      clientEmail: client?.email || '',
      clientPhone: client?.phone || '',
      clientAddress: client?.address || '',

      // Company settings
      companyName: settings.companyName || '',
      ninea: settings.ninea || '',
      rccm: settings.rccm || '',
      companyAddress: settings.address || '',
      footerMentions: settings.footerMentions || '',

      // Metadata
      projectTitle: invoice.metadata?.projectTitle || '',
      discountRate: invoice.metadata?.discountRate ? `${invoice.metadata.discountRate}%` : '',
      maintenanceAmount: invoice.metadata?.maintenanceAmount || '',
      maintenancePeriod: invoice.metadata?.maintenancePeriod || '',
      paymentTerms: invoice.metadata?.paymentTerms || '',
      deliveryTerms: invoice.metadata?.deliveryTerms || '',
      deliveryDelay: invoice.metadata?.deliveryDelay || '',
      quotationValidity: invoice.metadata?.quotationValidity || '',
      
      // Custom fields
      customField1: invoice.metadata?.customField1 || '',
      customField2: invoice.metadata?.customField2 || '',
      customField3: invoice.metadata?.customField3 || '',
      customField4: invoice.metadata?.customField4 || '',
      customField5: invoice.metadata?.customField5 || '',
      customLabel1: invoice.metadata?.customLabel1 || '',
      customLabel2: invoice.metadata?.customLabel2 || '',
      customLabel3: invoice.metadata?.customLabel3 || '',
      customLabel4: invoice.metadata?.customLabel4 || '',
      customLabel5: invoice.metadata?.customLabel5 || '',

      // Logo
      logo: processedLogo || '',
      companyLogo: processedLogo || '',

      // General Lines
      lines: formattedLines,

      // Specific Lines
      licenseLines,
      supportLines,
      serviceLines,

      // Specific Subtotals
      licensesSubtotal: formatCFA(licensesSubtotalAmount),
      supportSubtotal: formatCFA(supportSubtotalAmount),
      servicesSubtotal: formatCFA(servicesSubtotalAmount),

      // Totals
      subtotal: formatCFA(calculations.subtotal),
      hasDiscount: (calculations.discountAmount || 0) > 0,
      discountAmount: formatCFA(calculations.discountAmount || 0),
      tvaRate: `${formattedTvaRate}%`,
      tva: formatCFA(calculations.tva),
      total: formatCFA(calculations.total),
      amountInWords: numberToWordsCFA(calculations.total),
      
      // Legacy fallbacks
      invoiceNumber: invoice.number || invoice.id,
      phone: client.phone || '',
      email: client.email || '',
      formattedSubtotal: formatCFA(calculations.subtotal),
      formattedTva: formatCFA(calculations.tva),
      formattedTotal: formatCFA(calculations.total),
      address: settings.address || '',
      notes: invoice.metadata?.notes || settings.footerMentions || '',
      note: invoice.metadata?.notes || settings.footerMentions || '',
      
      // Additional variables
      totalDiscountAmount: formatCFA(calculations.discountAmount || 0),
      maintenanceInWords: numberToWordsCFA(supportSubtotalAmount)
    };

    // 5. Render document
    doc.render(data);

    // 5.5 Post-process XML for sections and subtotals styling
    let renderedXml = doc.getZip().file("word/document.xml")?.asText();
    if (renderedXml) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(renderedXml, "text/xml");
        const wns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
        
        // Find all text nodes to locate our markers
        const textNodes = xmlDoc.getElementsByTagNameNS(wns, "t");
        
        for (let i = 0; i < textNodes.length; i++) {
          const tNode = textNodes[i];
          const text = tNode.textContent || '';
          
          if (text.includes('[[SEC]]') || text.includes('[[SUB]]')) {
            const isSec = text.includes('[[SEC]]');
            
            // Clean the text
            tNode.textContent = text.replace(/\[\[SEC\]\]|\[\[ENDSEC\]\]|\[\[SUB\]\]|\[\[ENDSUB\]\]/g, '');
            
            // Find parent row
            let parentRow = tNode.parentNode;
            while (parentRow && parentRow.nodeName !== 'w:tr') {
              parentRow = parentRow.parentNode;
            }
            
            if (parentRow) {
              // Apply Bold to all runs in this row
              const runs = parentRow.querySelectorAll('w\\:r, r');
              runs.forEach((r) => {
                let rPr = r.querySelector('w\\:rPr, rPr');
                if (!rPr) {
                  rPr = xmlDoc.createElementNS(wns, "w:rPr");
                  r.insertBefore(rPr, r.firstChild);
                }
                if (!rPr.querySelector('w\\:b, b')) {
                  const b = xmlDoc.createElementNS(wns, "w:b");
                  rPr.appendChild(b);
                }
              });

              if (isSec) {
                // Apply Gray Background to all cells in this row
                const cells = parentRow.querySelectorAll('w\\:tc, tc');
                cells.forEach((tc) => {
                  let tcPr = tc.querySelector('w\\:tcPr, tcPr');
                  if (!tcPr) {
                    tcPr = xmlDoc.createElementNS(wns, "w:tcPr");
                    tc.insertBefore(tcPr, tc.firstChild);
                  }
                  
                  // Remove existing shading if any
                  const existingShd = tcPr.querySelector('w\\:shd, shd');
                  if (existingShd) tcPr.removeChild(existingShd);
                  
                  const shd = xmlDoc.createElementNS(wns, "w:shd");
                  shd.setAttributeNS(wns, "w:val", "clear");
                  shd.setAttributeNS(wns, "w:color", "auto");
                  shd.setAttributeNS(wns, "w:fill", "E2E8F0"); // Tailwind slate-200
                  tcPr.appendChild(shd);
                  
                  // Center text
                  const pPrs = tc.querySelectorAll('w\\:pPr, pPr');
                  pPrs.forEach((pPr) => {
                    let jc = pPr.querySelector('w\\:jc, jc');
                    if (!jc) {
                      jc = xmlDoc.createElementNS(wns, "w:jc");
                      pPr.appendChild(jc);
                    }
                    jc.setAttributeNS(wns, "w:val", "center");
                  });
                });
              }
            }
          }
        }
        
        const serializer = new XMLSerializer();
        const newXml = serializer.serializeToString(xmlDoc);
        doc.getZip().file("word/document.xml", newXml);
      } catch (err) {
        console.error("Error post-processing Word XML", err);
      }
    }

    // 6. Generate blob
    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // 7. Save file using File System Access API if available
    if (fileHandle) {
      const writable = await fileHandle.createWritable();
      await writable.write(out);
      await writable.close();
      return true;
    }

    // Fallback for browsers without File System Access API (e.g. Firefox/Safari)
    const isProforma = invoice.type === 'proforma' || invoice.id?.startsWith('PRO');
    const prefix = isProforma ? 'Proforma' : 'Facture';
    const finalFilename = filename || `${prefix}_${invoice.number || invoice.id}`.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.docx';
    
    saveAs(out, finalFilename);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la génération du document Word:", error);
    return false;
  }
};
