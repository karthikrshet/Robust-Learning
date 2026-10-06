import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class ExperimentReportGenerator:
    """
    Generates academic-quality, publication-ready PDF evaluation reports
    from real experiment results.
    """
    @classmethod
    def generate_pdf(cls, experiment_data: Dict[str, Any], output_path: str) -> str:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()

        # Custom typography matching White + Blue aesthetic
        primary_blue = colors.HexColor("#1D4ED8") # deep blue
        dark_text = colors.HexColor("#0F172A")
        muted_text = colors.HexColor("#475569")
        light_bg = colors.HexColor("#F8FAFC")
        border_color = colors.HexColor("#E2E8F0")

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=18,
            leading=22,
            textColor=primary_blue,
            alignment=TA_LEFT,
            fontName="Helvetica-Bold"
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=muted_text,
            alignment=TA_LEFT
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=primary_blue,
            spaceBefore=14,
            spaceAfter=6,
            fontName="Helvetica-Bold"
        )
        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=dark_text
        )
        small_style = ParagraphStyle(
            "SmallBody",
            parent=styles["Normal"],
            fontSize=8,
            leading=11,
            textColor=muted_text
        )
        table_header_style = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontSize=8.5,
            leading=11,
            textColor=colors.white,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER
        )
        table_cell_style = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontSize=8,
            leading=10.5,
            textColor=dark_text,
            alignment=TA_CENTER
        )
        table_cell_left = ParagraphStyle(
            "TableCellLeft",
            parent=styles["Normal"],
            fontSize=8,
            leading=10.5,
            textColor=dark_text,
            alignment=TA_LEFT
        )

        story = []

        # Header
        story.append(Paragraph("Robust Learning Under Label Noise for Real-World Classification", title_style))
        story.append(Spacer(1, 4))
        exp_id = experiment_data.get("experiment_id", "EXP-001")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        story.append(Paragraph(f"<b>Evaluation & Reproducibility Report</b> | Experiment ID: {exp_id} | Generated: {timestamp}", subtitle_style))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceBefore=2, spaceAfter=10))

        # 1. Dataset & Configuration Overview
        story.append(Paragraph("1. Dataset & Experimental Setup", h2_style))
        ds_info = experiment_data.get("dataset_info", {})
        split_info = experiment_data.get("split_info", {})
        cfg = experiment_data.get("config", {})

        overview_data = [
            [Paragraph("<b>Target Variable:</b>", body_style), Paragraph(str(cfg.get("target_column", "N/A")), body_style),
             Paragraph("<b>Classes:</b>", body_style), Paragraph(f"{ds_info.get('num_classes', 0)} ({', '.join(ds_info.get('classes', []))})", body_style)],
            [Paragraph("<b>Total Rows:</b>", body_style), Paragraph(str(ds_info.get("total_rows", "N/A")), body_style),
             Paragraph("<b>Preprocessed Features:</b>", body_style), Paragraph(str(ds_info.get("features_count", "N/A")), body_style)],
            [Paragraph("<b>Train / Test Split:</b>", body_style), Paragraph(f"{split_info.get('train_samples', 'N/A')} ({int(split_info.get('train_ratio', 0.7)*100)}%) / {split_info.get('test_samples', 'N/A')} ({int(split_info.get('test_ratio', 0.3)*100)}%)", body_style),
             Paragraph("<b>Noise Levels Evaluated:</b>", body_style), Paragraph(", ".join([f"{int(float(n)*100)}%" for n in cfg.get("noise_levels", [])]), body_style)],
            [Paragraph("<b>Random Seed:</b>", body_style), Paragraph(str(cfg.get("random_seeds", [42])), body_style),
             Paragraph("<b>Noise Strategy:</b>", body_style), Paragraph(str(cfg.get("noise_strategy", "symmetric")).title(), body_style)],
        ]
        t_overview = Table(overview_data, colWidths=[120, 145, 120, 145])
        t_overview.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), light_bg),
            ("BOX", (0, 0), (-1, -1), 0.5, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_overview)
        story.append(Spacer(1, 10))

        # 2. Comprehensive Model Performance Table
        story.append(Paragraph("2. Model Evaluation Across Noise Levels", h2_style))
        story.append(Paragraph("Evaluated strictly on the clean holdout test set to measure genuine generalization ability under synthetic training noise.", small_style))
        story.append(Spacer(1, 4))

        model_results = experiment_data.get("model_results", [])
        results_table_data = [
            [
                Paragraph("Model", table_header_style),
                Paragraph("Type", table_header_style),
                Paragraph("Noise", table_header_style),
                Paragraph("Accuracy", table_header_style),
                Paragraph("Precision", table_header_style),
                Paragraph("Recall", table_header_style),
                Paragraph("F1-Score", table_header_style),
                Paragraph("Time (s)", table_header_style),
            ]
        ]

        for m in model_results:
            m_type_label = "Robust" if m.get("model_type") == "robust" else "Baseline"
            results_table_data.append([
                Paragraph(m.get("display_name", "Model"), table_cell_left),
                Paragraph(m_type_label, table_cell_style),
                Paragraph(m.get("noise_percent", "0%"), table_cell_style),
                Paragraph(f"{m.get('accuracy', 0.0):.4f}", table_cell_style),
                Paragraph(f"{m.get('precision', 0.0):.4f}", table_cell_style),
                Paragraph(f"{m.get('recall', 0.0):.4f}", table_cell_style),
                Paragraph(f"<b>{m.get('f1', 0.0):.4f}</b>", table_cell_style),
                Paragraph(f"{m.get('training_duration_sec', 0.0):.2f}", table_cell_style),
            ])

        t_results = Table(results_table_data, colWidths=[150, 50, 45, 55, 55, 55, 60, 55])
        t_results.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), primary_blue),
            ("GRID", (0, 0), (-1, -1), 0.5, border_color),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
        ]))
        story.append(t_results)
        story.append(Spacer(1, 10))

        # 3. Label Noise Detection Summary
        story.append(Paragraph("3. Confident Learning Label Issue Detection", h2_style))
        suspicious_samples = experiment_data.get("suspicious_samples", [])
        n_suspicious = sum(1 for s in suspicious_samples if s.get("is_suspicious"))
        total_training_samples = split_info.get("train_samples", 0)

        detect_summary = (
            f"Cross-validation out-of-fold probability estimation identified <b>{n_suspicious}</b> suspicious training samples "
            f"({round((n_suspicious / total_training_samples * 100), 2) if total_training_samples > 0 else 0}% of training split) "
            f"exceeding the issue threshold of {cfg.get('detection_threshold', 0.5):.2f}. "
            "These samples exhibited substantial margin disagreement between the assigned label and the learned distribution."
        )
        story.append(Paragraph(detect_summary, body_style))
        story.append(Spacer(1, 6))

        if suspicious_samples:
            susp_table_data = [
                [
                    Paragraph("Row ID", table_header_style),
                    Paragraph("Observed Label", table_header_style),
                    Paragraph("Predicted Class", table_header_style),
                    Paragraph("Confidence", table_header_style),
                    Paragraph("Observed Prob", table_header_style),
                    Paragraph("Issue Score", table_header_style),
                    Paragraph("Status", table_header_style),
                ]
            ]
            for s in suspicious_samples[:8]:  # Show top 8 suspicious samples in PDF
                susp_table_data.append([
                    Paragraph(str(s.get("sample_id", "")), table_cell_style),
                    Paragraph(str(s.get("observed_label_name", "")), table_cell_style),
                    Paragraph(str(s.get("predicted_label_name", "")), table_cell_style),
                    Paragraph(f"{s.get('confidence', 0.0):.2f}", table_cell_style),
                    Paragraph(f"{s.get('observed_probability', 0.0):.2f}", table_cell_style),
                    Paragraph(f"<b>{s.get('issue_score', 0.0):.2f}</b>", table_cell_style),
                    Paragraph(s.get("status", ""), table_cell_style),
                ])
            t_susp = Table(susp_table_data, colWidths=[55, 95, 95, 60, 65, 65, 95])
            t_susp.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), primary_blue),
                ("GRID", (0, 0), (-1, -1), 0.5, border_color),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
            ]))
            story.append(t_susp)
            story.append(Spacer(1, 10))

        # 4. Factual Academic Findings
        story.append(Paragraph("4. Academic Findings & Discussion", h2_style))
        findings = experiment_data.get("findings", [])
        if findings:
            for f in findings:
                story.append(Paragraph(f"• <b>{f.get('category')}:</b> {f.get('finding')}", body_style))
                story.append(Spacer(1, 3))
        else:
            story.append(Paragraph("Model training completed. Refer to metrics table for performance comparisons.", body_style))

        story.append(Spacer(1, 8))

        # 5. Methodological Limitations & Reproducibility Notice
        story.append(Paragraph("5. Methodological Notes & Reproducibility", h2_style))
        repro_text = (
            "<b>Reproducibility:</b> Results are strictly deterministic given the configured random seed and split ratios. "
            "Label noise was applied solely to the training set; test labels remained unaltered to ensure valid evaluation. "
            "<br/><b>Academic Note:</b> Confident learning scores indicate statistical discrepancy between observed labels and feature density; "
            "they represent potential label noise, not mathematical proof of label error in uncontrolled environments."
        )
        story.append(Paragraph(repro_text, small_style))

        doc.build(story)
        return output_path
