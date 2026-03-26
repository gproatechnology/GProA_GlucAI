from io import BytesIO
from typing import List
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

from app.models.project import Project
from app.models.calculation import Calculation, CalculationType

def create_header_footer(canvas, doc, project_name):
    """Draws a simple header and footer on each page."""
    canvas.saveState()
    
    # Header
    canvas.setFont('Helvetica-Bold', 10)
    canvas.drawString(inch, letter[1] - 0.5 * inch, f"GECRAI 1.2 - Memoria de Cálculo: {project_name}")
    canvas.line(inch, letter[1] - 0.55 * inch, letter[0] - inch, letter[1] - 0.55 * inch)
    
    # Footer
    canvas.setFont('Helvetica', 9)
    page_number = canvas.getPageNumber()
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    canvas.drawString(inch, 0.5 * inch, f"Generado: {date_str}")
    canvas.drawRightString(letter[0] - inch, 0.5 * inch, f"Página {page_number}")
    canvas.line(inch, 0.65 * inch, letter[0] - inch, 0.65 * inch)
    
    canvas.restoreState()

def generate_project_report(project: Project, calculations: List[Calculation]) -> BytesIO:
    """Generates a PDF report for a given project and its calculations."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=20,
        textColor=colors.HexColor('#1e40af') # Blue-800
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=15,
        textColor=colors.HexColor('#374151') # Gray-700
    )
    normal_style = styles['Normal']
    
    story = []
    
    # ── Title Section ──
    story.append(Paragraph("MEMORIA DE CÁLCULO ELÉCTRICO", title_style))
    story.append(Paragraph("Alineado con NOM-001-SEDE-2012 y NEC", styles['Italic']))
    story.append(Spacer(1, 0.25 * inch))
    
    # ── Project Info ──
    project_data = [
        ["Información del Proyecto", ""],
        ["Nombre:", project.name],
        ["Tipo:", project.project_type.value.capitalize() if project.project_type else "N/A"],
        ["Ubicación:", project.location or "No especificada"],
        ["Tensión Base:", project.voltage_level or "N/A"],
        ["Sistema:", project.system_type or "N/A"],
        ["Estado:", project.status.value.capitalize() if project.status else "N/A"]
    ]
    
    t_project = Table(project_data, colWidths=[2 * inch, 4.5 * inch])
    t_project.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#111827')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_project)
    story.append(Spacer(1, 0.4 * inch))
    
    # ── Calculations Summary ──
    story.append(Paragraph("Resumen de Cálculos", subtitle_style))
    
    if not calculations:
        story.append(Paragraph("No hay cálculos asociados a este proyecto.", normal_style))
    else:
        summary_data = [["Tipo", "Nombre", "Resultado", "Estado"]]
        for calc in calculations:
            result_summary = "N/A"
            if calc.calculation_type == CalculationType.VOLTAGE_DROP:
                vd = calc.results.get('voltage_drop_percent', 'N/A')
                result_summary = f"{vd}% VD"
            elif calc.calculation_type == CalculationType.CONDUCTOR_SIZING:
                size = calc.results.get('minimum_conductor_size', 'N/A')
                result_summary = f"Calibre: {size}"
                
            status_text = "Conforme" if calc.is_compliant else "No Conforme"
            status_text = "Advertencia" if calc.compliance_status == "warning" else status_text
                
            summary_data.append([
                calc.calculation_type.value.replace('_', ' ').title(),
                calc.name,
                str(result_summary),
                status_text
            ])
            
        t_summary = Table(summary_data, colWidths=[1.5 * inch, 2 * inch, 1.5 * inch, 1.5 * inch])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')), # Blue-600
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ]))
        
        # Colorize statuses
        for i, row in enumerate(summary_data[1:], start=1):
            if row[3] == "Conforme":
                t_summary.setStyle(TableStyle([('TEXTCOLOR', (3, i), (3, i), colors.HexColor('#059669'))])) # Emerald-600
            elif row[3] == "Advertencia":
                t_summary.setStyle(TableStyle([('TEXTCOLOR', (3, i), (3, i), colors.HexColor('#d97706'))])) # Amber-600
            else:
                t_summary.setStyle(TableStyle([('TEXTCOLOR', (3, i), (3, i), colors.HexColor('#dc2626'))])) # Red-600
                
        story.append(t_summary)
        story.append(PageBreak())
        
        # ── Detailed Calculations ──
        story.append(Paragraph("Detalles Analíticos", title_style))
        
        for calc in calculations:
            story.append(Paragraph(f"Cálculo: {calc.name}", subtitle_style))
            story.append(Paragraph(f"Tipo: {calc.calculation_type.value.replace('_', ' ').title()}", styles['Italic']))
            story.append(Spacer(1, 0.1 * inch))
            
            # Input Data
            in_data = [["Parámetro de Entrada", "Valor"]]
            for k, v in calc.input_data.items():
                in_data.append([k.replace('_', ' ').title(), str(v)])
                
            t_in = Table(in_data, colWidths=[2.5 * inch, 4 * inch])
            t_in.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ]))
            story.append(t_in)
            story.append(Spacer(1, 0.15 * inch))
            
            # Output Data
            out_data = [["Resultado Obtenido", "Valor"]]
            # Filter non-dict pure values
            for k, v in calc.results.items():
                if k not in ['violations', 'recommendations', 'standards_referenced', 'compliance_status']:
                    out_data.append([k.replace('_', ' ').title(), str(v)])
            
            if len(out_data) > 1:
                t_out = Table(out_data, colWidths=[2.5 * inch, 4 * inch])
                t_out.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dbeafe')), # Blue-100
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bfdbfe')),
                ]))
                story.append(t_out)
                story.append(Spacer(1, 0.2 * inch))
                
            # Violations & Recommendations
            if calc.violations:
                story.append(Paragraph("Infracciones Normativas (Riesgo):", ParagraphStyle('ViolationsH', parent=normal_style, textColor=colors.red, fontName='Helvetica-Bold')))
                for v in calc.violations:
                    story.append(Paragraph(f"• [{v.get('code', 'N/A')}] {v.get('message', '')}", normal_style))
                story.append(Spacer(1, 0.1 * inch))
                
            if calc.recommendations:
                story.append(Paragraph("Recomendaciones:", ParagraphStyle('RecH', parent=normal_style, textColor=colors.HexColor('#059669'), fontName='Helvetica-Bold')))
                for r in calc.recommendations:
                    story.append(Paragraph(f"• {r}", normal_style))
                story.append(Spacer(1, 0.1 * inch))
                
            if calc.standards_referenced:
                stds = ", ".join(calc.standards_referenced)
                story.append(Paragraph(f"Normas aplicadas: {stds}", ParagraphStyle('Stds', parent=normal_style, fontSize=8, textColor=colors.gray)))
                
            story.append(Spacer(1, 0.4 * inch))
            
    # Build Document
    doc.build(story, onFirstPage=lambda c, d: create_header_footer(c, d, project.name), onLaterPages=lambda c, d: create_header_footer(c, d, project.name))
    
    buffer.seek(0)
    return buffer

def generate_calculation_report(calculation: Calculation) -> BytesIO:
    """Generates a PDF report for a single calculation."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=20,
        textColor=colors.HexColor('#1e40af')
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=15,
        textColor=colors.HexColor('#374151')
    )
    normal_style = styles['Normal']
    
    story = []
    
    story.append(Paragraph("MEMORIA DE CÁLCULO ELÉCTRICO", title_style))
    story.append(Paragraph(f"Cálculo: {calculation.name}", subtitle_style))
    calc_type_name = calculation.calculation_type.value.replace('_', ' ').title() if hasattr(calculation.calculation_type, 'value') else "Cálculo"
    story.append(Paragraph(f"Tipo: {calc_type_name}", styles['Italic']))
    
    if calculation.description:
        story.append(Paragraph(calculation.description, normal_style))
    story.append(Spacer(1, 0.25 * inch))
    
    # Input Data
    story.append(Paragraph("Parámetros de Entrada", subtitle_style))
    in_data = [["Parámetro", "Valor"]]
    for k, v in calculation.input_data.items():
        in_data.append([k.replace('_', ' ').title(), str(v)])
        
    t_in = Table(in_data, colWidths=[2.5 * inch, 4 * inch])
    t_in.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    story.append(t_in)
    story.append(Spacer(1, 0.25 * inch))
    
    # Output Data
    story.append(Paragraph("Resultados Obtenidos", subtitle_style))
    out_data = [["Resultado", "Valor"]]
    for k, v in calculation.results.items():
        if k not in ['violations', 'recommendations', 'standards_referenced', 'compliance_status']:
            out_data.append([k.replace('_', ' ').title(), str(v)])
    
    if len(out_data) > 1:
        t_out = Table(out_data, colWidths=[2.5 * inch, 4 * inch])
        t_out.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dbeafe')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bfdbfe')),
        ]))
        story.append(t_out)
        story.append(Spacer(1, 0.25 * inch))
        
    # Validation
    story.append(Paragraph("Validación Normativa", subtitle_style))
    status_text = "Conforme" if getattr(calculation, 'is_compliant', True) else "No Conforme"
    if hasattr(calculation, 'compliance_status'):
        if calculation.compliance_status == 'compliant':
            status_text = "Satisfactorio"
        elif calculation.compliance_status == 'warning':
            status_text = "Advertencia"
        elif calculation.compliance_status == 'non_compliant':
            status_text = "No Cumple"
            
    story.append(Paragraph(f"<b>Estado:</b> {status_text}", normal_style))
    
    # Violations & Recommendations
    violations = getattr(calculation, 'violations', calculation.results.get('violations', []))
    if violations:
        story.append(Spacer(1, 0.1 * inch))
        story.append(Paragraph("Observaciones / Infracciones:", ParagraphStyle('ViolationsH', parent=normal_style, textColor=colors.red, fontName='Helvetica-Bold')))
        for v in violations:
            story.append(Paragraph(f"• [{v.get('code', 'N/A')}] {v.get('message', '')}", normal_style))
            
    recommendations = getattr(calculation, 'recommendations', calculation.results.get('recommendations', []))
    if recommendations:
        story.append(Spacer(1, 0.1 * inch))
        story.append(Paragraph("Recomendaciones:", ParagraphStyle('RecH', parent=normal_style, textColor=colors.HexColor('#059669'), fontName='Helvetica-Bold')))
        for r in recommendations:
            story.append(Paragraph(f"• {r}", normal_style))
            
    standards = getattr(calculation, 'standards_referenced', calculation.results.get('standards_referenced', []))
    if standards:
        story.append(Spacer(1, 0.1 * inch))
        stds = ", ".join(standards)
        story.append(Paragraph(f"<b>Normas aplicadas:</b> {stds}", normal_style))
        
    # Build Document
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    def simple_header_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica-Bold', 10)
        canvas.drawString(inch, letter[1] - 0.5 * inch, f"GECRAI 1.2 - Memoria de Cálculo Individual")
        canvas.line(inch, letter[1] - 0.55 * inch, letter[0] - inch, letter[1] - 0.55 * inch)
        canvas.setFont('Helvetica', 9)
        canvas.drawString(inch, 0.5 * inch, f"Generado: {date_str}")
        canvas.drawRightString(letter[0] - inch, 0.5 * inch, f"Página {canvas.getPageNumber()}")
        canvas.line(inch, 0.65 * inch, letter[0] - inch, 0.65 * inch)
        canvas.restoreState()
    
    doc.build(story, onFirstPage=simple_header_footer, onLaterPages=simple_header_footer)
    
    buffer.seek(0)
    return buffer
