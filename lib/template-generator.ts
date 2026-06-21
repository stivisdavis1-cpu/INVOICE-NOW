import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType, HeadingLevel, ShadingType } from 'docx';

export async function generateProTemplateAsBase64(type: 'FACTURE' | 'PROFORMA' = 'FACTURE', logoBase64Url?: string | null): Promise<string> {
  const companyChildren: any[] = [];
  
  if (logoBase64Url) {
    companyChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({ text: "{%logo}" }),
        ],
      })
    );
  } else {
    companyChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({ text: "{companyName}", bold: true, size: 36 }),
        ],
      })
    );
  }

  const companyDetails = new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({ text: "{companyAddress}\n{nineaLabel}: {ninea} | {rccmLabel}: {rccm}\nTél: {companyPhone} | Email: {companyEmail}", color: "666666" }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // HEADER: Logo and Company Info
          ...companyChildren,
          companyDetails,

          new Paragraph({ text: "", spacing: { before: 200, after: 200 } }),
          
          // Horizontal Line
          new Paragraph({
            border: {
              bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 }
            }
          }),
          
          new Paragraph({ text: "", spacing: { before: 200, after: 200 } }),

          // DOCUMENT TITLE AND CLIENT INFO GRID
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: type + " N° {invoiceId}", bold: true, size: 28 }),
                        ],
                        spacing: { after: 200 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Émise le {issueDate}", bold: true }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Échéance : {dueDate}" }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Facturé à :", bold: true, size: 24 })],
                        spacing: { after: 100 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "{clientName}", bold: true, size: 24 })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "{clientAddress}" })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "{clientEmail}" })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "{clientPhone}" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 300, after: 300 } }),

          // LINES TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true, color: "000000" })] })],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Qté", bold: true, color: "000000" })] })],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Prix Unitaire", bold: true, color: "000000" })] })],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Montant", bold: true, color: "000000" })] })],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "{#lines}" })] }),
                  new TableCell({ children: [new Paragraph({ text: "" })] }),
                  new TableCell({ children: [new Paragraph({ text: "" })] }),
                  new TableCell({ children: [new Paragraph({ text: "" })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    shading: { type: ShadingType.CLEAR, fill: "E2E8F0" },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "{#isSection}{description}", bold: true })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                  new TableCell({ 
                    shading: { type: ShadingType.CLEAR, fill: "E2E8F0" },
                    children: [new Paragraph({ text: "" })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                  new TableCell({ 
                    shading: { type: ShadingType.CLEAR, fill: "E2E8F0" },
                    children: [new Paragraph({ text: "" })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                  new TableCell({ 
                    shading: { type: ShadingType.CLEAR, fill: "E2E8F0" },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, text: "{/isSection}" })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "{#isItem}{description}" })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: "{quantityDisplay}" })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, text: "{formattedUnitPrice}" })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, text: "{formattedTotal}{/isItem}" })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "{/lines}" })] }),
                  new TableCell({ children: [new Paragraph({ text: "" })] }),
                  new TableCell({ children: [new Paragraph({ text: "" })] }),
                  new TableCell({ children: [new Paragraph({ text: "" })] }),
                ]
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400, after: 400 } }),

          // TOTALS
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Sous-total :", bold: true })] })
                  ], margins: { top: 100, bottom: 100, right: 100 } }),
                  new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, text: "{subtotal}" })
                  ], margins: { top: 100, bottom: 100, right: 100 } }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TVA ({tvaRate}) :", bold: true })] })
                  ], margins: { top: 100, bottom: 100, right: 100 } }),
                  new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, text: "{tva}" })
                  ], margins: { top: 100, bottom: 100, right: 100 } }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TOTAL TTC :", bold: true, size: 28 })] })
                  ], margins: { top: 100, bottom: 100, right: 100 } }),
                  new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{total}", bold: true, size: 28 })] })
                  ], margins: { top: 100, bottom: 100, right: 100 } }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 200, after: 200 } }),

          // AMOUNT IN WORDS
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Arrêté la présente facture à la somme de : ", bold: true }),
              new TextRun({ text: "{amountInWords}", bold: true, italics: true }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400, after: 400 } }),

          // NOTES
          new Paragraph({
            children: [
              new TextRun({ text: "Mentions légales / Notes :", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "{footerMentions}", color: "666666" }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  // Convert buffer to base64
  return "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64," + Buffer.from(buffer).toString('base64');
}
