import { getTaxonomyByDomain } from "./taxonomy.repository";

export async function buildTaxonomyPromptContext(domainId: number) {
  const taxonomy = await getTaxonomyByDomain(domainId);

  const lines: string[] = [];

  lines.push("VALID HOTEL TAXONOMY");
  lines.push("");
  lines.push("IMPORTANT:");
  lines.push("Return ONLY the Primary Key values shown below.");
  lines.push("Do NOT return numeric codes.");
  lines.push("Do NOT return cod_numerico values.");
  lines.push("Never return values like 02010000, 02030000, 02050100.");
  lines.push("");
  lines.push("Correct example:");
  lines.push('{ "area_code": "HOTEL_FACILITIES", "cause_code": "HOTEL_FAC_GARDENS", "subcause_code": null }');
  lines.push("");
  lines.push("Wrong example:");
  lines.push('{ "area_code": "02050000", "cause_code": "02050600", "subcause_code": null }');
  lines.push("");
  lines.push("Use ONLY the Primary Key codes listed below.");
  lines.push("If none applies clearly, return null.");
  lines.push("");

  for (const area of taxonomy.areas) {
    lines.push("AREA");
    lines.push(`Primary Key / area_code TO RETURN: ${area.area_code}`);
    lines.push(`Name: ${area.area_name}`);
    lines.push(`Numeric Code / cod_numerico DO NOT RETURN: ${area.cod_numerico ?? ""}`);
    lines.push(`Description: ${area.description ?? ""}`);

    const causes = taxonomy.causes.filter(
      (cause) => cause.area_code === area.area_code
    );

    for (const cause of causes) {
      lines.push("");
      lines.push("  CAUSE");
      lines.push(`  Primary Key / cause_code TO RETURN: ${cause.cause_code}`);
      lines.push(`  Name: ${cause.cause_name}`);
      lines.push(`  Numeric Code / cod_numerico DO NOT RETURN: ${cause.cod_numerico ?? ""}`);
      lines.push(`  Description: ${cause.description ?? ""}`);

      const subcauses = taxonomy.subcauses.filter(
        (subcause) => subcause.cause_code === cause.cause_code
      );

      for (const subcause of subcauses) {
        lines.push("");
        lines.push("    SUBCAUSE");
        lines.push(`    Primary Key / subcause_code TO RETURN: ${subcause.subcause_code}`);
        lines.push(`    Name: ${subcause.subcause_name}`);
        lines.push(`    Numeric Code / cod_numerico DO NOT RETURN: ${subcause.cod_numerico ?? ""}`);
        lines.push(`    Description: ${subcause.description ?? ""}`);
      }
    }

    lines.push("");
    lines.push("----");
    lines.push("");
  }

  return lines.join("\n");
}