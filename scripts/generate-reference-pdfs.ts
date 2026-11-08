import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { REFERENCE_DOCUMENTS } from "../src/lib/reference-documents";

/**
 * Generates the six one-page reference PDFs from plain text. Keeping the
 * generator dependency-free means `npm ci` is enough to rebuild the library.
 */

type Section = { heading: string; lines: string[] };
type Content = { intro: string; sections: Section[] };

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BULLET = "\x95";

const PINE = "0.071 0.231 0.180";
const INK = "0.082 0.110 0.094";
const INK_3 = "0.392 0.439 0.416";
const LINE = "0.875 0.894 0.871";

const CONTENT: Record<string, Content> = {
  "stock-system-user-guide": {
    intro:
      "This guide covers the daily workspace: signing in, moving between sections, changing inventory, searching, and keeping access under control.",
    sections: [
      {
        heading: "Sign in",
        lines: [
          "Open the portal and enter the username and password issued to you. Credentials are personal; do not share them.",
          "Sign out from the account menu when you finish, especially on a shared or public device.",
          "If several attempts fail, wait before trying again. Repeated failures are throttled and recorded."
        ]
      },
      {
        heading: "Find your way around",
        lines: [
          "The sidebar lists the workspace on desktop; the bottom bar carries the same destinations on mobile.",
          "Workspace covers Overview, Inventory, Movements, and Suppliers.",
          "Masters groups Centre Master, Item Master, and Document Master."
        ]
      },
      {
        heading: "Work with inventory",
        lines: [
          "Search by product, SKU, or supplier, then filter by category, supplier, or stock status.",
          "Open a product to receive stock, remove stock, or set a physical count. Each action asks for a quantity and optional reference.",
          "Every change writes a movement entry and an audit record. Stock cannot be edited silently."
        ]
      },
      {
        heading: "Quick find",
        lines: [
          "Press Ctrl+K (Cmd+K on macOS) or / to open quick find from anywhere in the workspace.",
          "Type a product, SKU, or supplier, choose a result with the arrow keys, and press Enter to open it."
        ]
      },
      {
        heading: "Access and read-only areas",
        lines: [
          "Your role determines which actions are available. If a control is not offered for your account, the action is also rejected by the application.",
          "Centre Master, Item Master, and Document Master are read-only reference views.",
          "Reference PDFs open in a new tab. Close the tab when you are finished."
        ]
      }
    ]
  },
  "receiving-stock-quick-reference": {
    intro:
      "Use this checklist whenever stock arrives. The goal is one clean receipt: correct item, correct quantity, correct paperwork, and a movement record that explains the change.",
    sections: [
      {
        heading: "1. Check the delivery",
        lines: [
          "Match the delivery note to the purchase order or transfer request: supplier, item, SKU, and expected quantity.",
          "Inspect packaging before signing. Photograph damage and keep the carrier's paperwork.",
          "Do not accept an item that is not in the catalogue until it has been added and approved."
        ]
      },
      {
        heading: "2. Record the receipt",
        lines: [
          "Go to Inventory, find the product by name or SKU, and choose Receive stock.",
          "Enter the quantity actually received, not the quantity ordered.",
          "Add the delivery note or invoice number as the reference and a short note for anything unusual.",
          "Submit once. The new balance appears immediately and a Receipt movement is written."
        ]
      },
      {
        heading: "3. Verify the result",
        lines: [
          "Confirm the new balance equals the previous balance plus the quantity received.",
          "Open Movements and check the entry: type, quantity, reference, actor, and time.",
          "Store the delivery note with the receipt record for the current period."
        ]
      },
      {
        heading: "4. Handle exceptions",
        lines: [
          "Short delivery: receive only what arrived and note the shortage on the delivery note.",
          "Damaged goods: quarantine them, do not add them to sellable stock, and notify the supplier.",
          "Wrong item: do not receipt it into the wrong SKU. Resolve the mismatch before recording stock.",
          "If a receipt was recorded incorrectly, correct it with an adjustment or physical count that references the original entry. Do not create a second receipt to hide the first."
        ]
      }
    ]
  },
  "dispatch-issue-quick-reference": {
    intro:
      "A dispatch reduces on-hand stock. Check the request, confirm availability, issue against a reference, and make sure the recipient and the record agree.",
    sections: [
      {
        heading: "1. Confirm the request",
        lines: [
          "Check the item, quantity, requesting location or person, and the authorisation for the issue.",
          "Confirm the unit of measure; a request for boxes is not a request for pieces.",
          "If the request is outside the approved catalogue, stop and escalate it."
        ]
      },
      {
        heading: "2. Check availability",
        lines: [
          "Review on-hand stock and the reorder point before promising a quantity.",
          "Leave enough stock to cover the location's requirement; do not issue the last unit without approval.",
          "If stock is short, record the quantity that can be issued and agree the balance as a backorder."
        ]
      },
      {
        heading: "3. Issue the stock",
        lines: [
          "Go to Inventory, find the product, and choose Remove stock.",
          "Enter the issued quantity and a reference such as a requisition, work order, or dispatch note.",
          "Add a note when the issue is partial or urgent. Submit once.",
          "Over-removal is blocked; stock cannot be driven below zero."
        ]
      },
      {
        heading: "4. Close out",
        lines: [
          "Ask the recipient to check the item and quantity before they leave.",
          "Verify the new balance and the Dispatch movement in the audit history.",
          "File the signed requisition or dispatch note with the movement reference.",
          "Returns come back through Receive stock, with the original reference in the note."
        ]
      }
    ]
  },
  "physical-stock-count-quick-reference": {
    intro:
      "A physical count is the control of last resort. Count what is there, record the truth, and investigate differences instead of forcing the number to match the system.",
    sections: [
      {
        heading: "1. Prepare",
        lines: [
          "Choose the area and freeze dispatches and receipts for it while the count runs.",
          "Print a count sheet from the current inventory view; include SKU, unit, location, and system quantity.",
          "Assign counters who do not normally work the same area when segregation is possible."
        ]
      },
      {
        heading: "2. Count",
        lines: [
          "Count one location or bin at a time. Count sealed packs separately from loose units.",
          "Record quantities in the product's unit. Do not convert between units on the sheet.",
          "Record empty locations as zero; do not leave a line blank.",
          "Sign and date the sheet. A second counter should verify high-value or high-risk items."
        ]
      },
      {
        heading: "3. Record the count",
        lines: [
          "Go to Inventory, open the product, and choose Set count.",
          "Enter the counted quantity, a reference such as COUNT-YYYY-MM-DD, and a note for the area or shift.",
          "Do not adjust the counted number to match the expected balance. The application records the variance."
        ]
      },
      {
        heading: "4. Investigate and close",
        lines: [
          "Recount before accepting a variance. Check for unrecorded receipts, dispatches, transfers, or misplacement.",
          "Document the cause and the corrective action; escalate material or repeated differences.",
          "Have a supervisor review and sign off. Keep count sheets and movement references together.",
          "Watch variance trends by item and location; a repeating gap usually points to a process problem."
        ]
      }
    ]
  },
  "centre-item-master-reference": {
    intro:
      "Centre Master and Item Master share one catalogue. A requirement line is the same record whether you open it from a location or from an item.",
    sections: [
      {
        heading: "Centre hierarchy",
        lines: [
          "Locations are organised as Centre, SubCentre, and Point. Each location has a unique badge code and, where applicable, a parent centre.",
          "The hierarchy is a reporting structure, not a stock transfer path. Moving stock between locations still needs a receipt and a dispatch.",
          "Open a centre to see its children and every catalogue item it tracks."
        ]
      },
      {
        heading: "Requirement lines",
        lines: [
          "Each location tracks the shared catalogue with a required quantity and an on-hand quantity.",
          "Required quantities differ by location; the same item can need one unit at a point and several at a centre.",
          "Requirements are master data. Day-to-day stock changes update on-hand quantities, not the requirement."
        ]
      },
      {
        heading: "Coverage and status",
        lines: [
          "Covered: on hand meets or exceeds the requirement.",
          "Short: on hand is greater than zero but below the requirement.",
          "Missing: on hand is zero while the requirement is greater than zero.",
          "Shortfall is the requirement minus on hand, never less than zero."
        ]
      },
      {
        heading: "Reading health",
        lines: [
          "A location is Critical when any line is missing, Needs stock when any line is short, and Ready when every line is covered.",
          "An item view aggregates the same lines across all locations, so the two masters always agree.",
          "Use the shortfall total to prioritise replenishment, then open the location or item for the detail."
        ]
      }
    ]
  },
  "roles-permissions-audit-reference": {
    intro:
      "Access is part of inventory control. Every account should have the smallest role that lets the person do their job, and every material change should be attributable.",
    sections: [
      {
        heading: "Roles",
        lines: [
          "Administrators manage products, stock, master data, and other accounts, including deletion where the application allows it.",
          "Operators handle day-to-day receiving, dispatch, and physical counts. They cannot remove products.",
          "A role is a boundary, not a promotion path. Change it only with an approved request."
        ]
      },
      {
        heading: "Enforcement",
        lines: [
          "Permissions are checked in the server action or route that performs the work, not only by hiding interface controls.",
          "Read-only masters and reference documents still require a signed-in session.",
          "Input is validated on the server; filters and identifiers never become raw database commands."
        ]
      },
      {
        heading: "Sessions and passwords",
        lines: [
          "Sessions use an httpOnly cookie. Only a hash of the session token is stored, and sessions expire.",
          "Password changes require the current password and revoke other sessions for that account.",
          "Sign out on shared devices. Never send credentials through chat or email."
        ]
      },
      {
        heading: "Audit trail",
        lines: [
          "Sign-in, sign-out, failed sign-in, password changes, product changes, receipts, dispatches, and counts are recorded.",
          "Entries keep the actor, action, entity, IP address where available, and timestamp.",
          "Audit records are append-only from the application. Define a retention period before pruning them."
        ]
      },
      {
        heading: "Routine checks",
        lines: [
          "Review inactive accounts and remove access promptly when someone leaves.",
          "Investigate repeated failed sign-ins and unusual after-hours activity.",
          "Back up the database and test restoration; an audit trail is only useful if the data survives."
        ]
      }
    ]
  }
};

function escapePdf(text: string) {
  return text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function textWidth(text: string, size: number, bold = false) {
  // Helvetica averages roughly 0.52-0.58em per glyph. A slightly generous
  // estimate keeps wrapped lines inside the margin.
  return text.length * size * (bold ? 0.58 : 0.55);
}

function wrap(text: string, maxWidth: number, size: number, bold = false) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, size, bold) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function textOp(x: number, y: number, size: number, font: "F1" | "F2", color: string, value: string) {
  return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdf(value)}) Tj ET`;
}

function rightTextOp(right: number, y: number, size: number, font: "F1" | "F2", color: string, value: string) {
  return textOp(right - textWidth(value, size, font === "F2"), y, size, font, color, value);
}

function fillRect(x: number, y: number, w: number, h: number, color: string) {
  return `q ${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`;
}

function rule(x1: number, y: number, x2: number, color = LINE, width = 0.7) {
  return `q ${color} RG ${width} w ${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S Q`;
}

function buildContentStream(title: string, content: Content) {
  const ops: string[] = [];
  let y = PAGE_H - 42;

  ops.push(fillRect(0, PAGE_H - 14, PAGE_W, 14, PINE));
  ops.push(textOp(MARGIN, PAGE_H - 34, 8.5, "F2", PINE, "STOCK MANAGEMENT SYSTEM"));
  ops.push(rightTextOp(PAGE_W - MARGIN, PAGE_H - 34, 8.5, "F2", INK_3, "ASO USERS"));
  ops.push(rule(MARGIN, PAGE_H - 44, PAGE_W - MARGIN));

  y = PAGE_H - 78;
  const titleLines = wrap(title, CONTENT_W, 21, true);
  for (const line of titleLines) {
    ops.push(textOp(MARGIN, y, 21, "F2", PINE, line));
    y -= 26;
  }

  y -= 2;
  for (const line of wrap(content.intro, CONTENT_W, 10.5)) {
    ops.push(textOp(MARGIN, y, 10.5, "F1", INK_3, line));
    y -= 14.5;
  }

  y -= 12;

  for (const section of content.sections) {
    y -= 12;
    ops.push(rule(MARGIN, y + 9, PAGE_W - MARGIN, LINE, 0.6));
    ops.push(textOp(MARGIN, y, 11.5, "F2", PINE, section.heading));
    y -= 17;

    for (const line of section.lines) {
      const wrapped = wrap(line, CONTENT_W - 14, 10.25);
      for (const [index, part] of wrapped.entries()) {
        if (index === 0) {
          ops.push(textOp(MARGIN, y, 10.25, "F1", PINE, BULLET));
          ops.push(textOp(MARGIN + 14, y, 10.25, "F1", INK, part));
        } else {
          ops.push(textOp(MARGIN + 14, y, 10.25, "F1", INK, part));
        }
        y -= 13.6;
      }
      y -= 1.8;
    }

    if (y < 78) {
      throw new Error(`Content for "${title}" overflows one page (y=${y.toFixed(1)}).`);
    }
  }

  ops.push(rule(MARGIN, 56, PAGE_W - MARGIN));
  ops.push(textOp(MARGIN, 40, 8, "F1", INK_3, "Stock Management System - ASO Users"));
  ops.push(rightTextOp(PAGE_W - MARGIN, 40, 8, "F1", INK_3, "Page 1 of 1"));

  return ops.join("\n");
}

function buildPdf(title: string, stream: string) {
  const objects: string[] = [];

  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  add(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`
  );
  add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  add(
    `<< /Title (${escapePdf(title)}) /Author (Stock Management System) /Creator (Stock Management System) /Producer (Stock Management System) /CreationDate (D:${stamp}Z) >>`
  );

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const [index, body] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

async function main() {
  const outputDir = path.join(process.cwd(), "private", "documents");
  await mkdir(outputDir, { recursive: true });

  for (const document of REFERENCE_DOCUMENTS) {
    const content = CONTENT[document.slug];
    if (!content) throw new Error(`No PDF content defined for ${document.slug}`);

    const stream = buildContentStream(document.title, content);
    const pdf = buildPdf(document.title, stream);
    await writeFile(path.join(outputDir, document.fileName), pdf);
    console.log(`Wrote ${document.fileName} (${(pdf.byteLength / 1024).toFixed(1)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
