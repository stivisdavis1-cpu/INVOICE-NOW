'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyTemplateButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="color: #2D8B6F;">FACTURE</h1>
        <p><strong>N° :</strong> {invoiceNumber}<br/><strong>Date :</strong> {issueDate}</p>
        <br/>
        <table width="100%" style="border: none;">
          <tr>
            <td width="50%" valign="top">
              <strong>De :</strong><br/>
              {companyName}<br/>
              {address}<br/>
              NINEA: {ninea}
            </td>
            <td width="50%" valign="top">
              <strong>À :</strong><br/>
              {clientName}<br/>
              {clientEmail}<br/>
              {clientPhone}
            </td>
          </tr>
        </table>
        <br/><br/>
        <table width="100%" border="1" cellspacing="0" cellpadding="8" style="border-collapse: collapse; border-color: #dddddd;">
          <tr style="background-color: #2D8B6F; color: white;">
            <th>Description</th>
            <th>Qté</th>
            <th>Prix Unitaire</th>
            <th>Montant</th>
          </tr>
          <tr>
            <td colspan="4" style="color: white; font-size: 1px;">{#lines}</td>
          </tr>
          <tr>
            <td>{description}</td>
            <td align="center">{quantity}</td>
            <td align="right">{formattedUnitPrice}</td>
            <td align="right">{formattedTotal}</td>
          </tr>
          <tr>
            <td colspan="4" style="color: white; font-size: 1px;">{/lines}</td>
          </tr>
        </table>
        <br/>
        <table width="100%" style="border: none;">
          <tr>
            <td width="60%"></td>
            <td width="40%">
              <table width="100%" border="0" cellspacing="0" cellpadding="4">
                <tr><td align="right">Sous-total :</td><td align="right"><strong>{formattedSubtotal}</strong></td></tr>
                <tr><td align="right">TVA :</td><td align="right"><strong>{formattedTva}</strong></td></tr>
                <tr><td align="right" style="color: #2D8B6F;"><strong>TOTAL TTC :</strong></td><td align="right" style="color: #2D8B6F;"><strong>{formattedTotal}</strong></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    try {
      const blobHtml = new Blob([htmlContent], { type: "text/html" });
      const blobText = new Blob([htmlContent.replace(/<[^>]*>?/gm, '')], { type: "text/plain" });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText,
        })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copié !" : "Copier la base du modèle"}
    </button>
  );
}
