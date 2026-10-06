import os
import io
import csv
import hashlib
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

class DatasetValidationError(Exception):
    """Raised when dataset fails validation rules."""
    pass

class DatasetLoader:
    """
    Robust dataset loading and inspection supporting CSV and Excel files.
    Calculates SHA256 hashes, detects delimiters/encodings, and produces
    rigorous exploratory statistics directly from actual data.
    """

    MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
    MAX_ROWS = 200_000
    MAX_COLS = 500

    @staticmethod
    def compute_hash(file_bytes: bytes) -> str:
        """Compute deterministic SHA256 checksum of uploaded bytes."""
        hasher = hashlib.sha256()
        hasher.update(file_bytes)
        return hasher.hexdigest()

    @classmethod
    def load_from_bytes(
        cls,
        file_bytes: bytes,
        filename: str,
        sheet_name: Optional[str] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Loads dataset into pandas DataFrame safely, returning dataframe and file metadata.
        """
        if len(file_bytes) > cls.MAX_FILE_SIZE_BYTES:
            raise DatasetValidationError(
                f"File size exceeds maximum allowed limit of {cls.MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
            )
        if len(file_bytes) == 0:
            raise DatasetValidationError("Uploaded file is empty.")

        ext = os.path.splitext(filename)[1].lower()
        file_hash = cls.compute_hash(file_bytes)

        df: Optional[pd.DataFrame] = None
        sheets: List[str] = []

        if ext in [".csv", ".txt"]:
            df = cls._read_csv_with_fallback(file_bytes)
        elif ext in [".xlsx", ".xls"]:
            excel_file = io.BytesIO(file_bytes)
            xl = pd.ExcelFile(excel_file)
            sheets = xl.sheet_names
            target_sheet = sheet_name if sheet_name and sheet_name in sheets else sheets[0]
            df = pd.read_excel(excel_file, sheet_name=target_sheet)
        elif ext == ".parquet":
            df = pd.read_parquet(io.BytesIO(file_bytes))
        else:
            raise DatasetValidationError(
                f"Unsupported file format '{ext}'. Allowed formats are .csv, .xlsx, .xls, .parquet"
            )

        if df is None or df.empty:
            raise DatasetValidationError("Dataset parsed successfully but contains 0 rows.")

        if df.shape[0] > cls.MAX_ROWS:
            raise DatasetValidationError(
                f"Dataset contains {df.shape[0]} rows, exceeding the safe limit of {cls.MAX_ROWS} rows."
            )
        if df.shape[1] > cls.MAX_COLS:
            raise DatasetValidationError(
                f"Dataset contains {df.shape[1]} columns, exceeding the safe limit of {cls.MAX_COLS} columns."
            )

        # Standardize column names (strip whitespace, ensure string)
        df.columns = [str(c).strip() for c in df.columns]

        meta = {
            "filename": filename,
            "file_size": len(file_bytes),
            "file_hash": file_hash,
            "sheets": sheets,
            "selected_sheet": sheet_name or (sheets[0] if sheets else None),
            "row_count": int(df.shape[0]),
            "column_count": int(df.shape[1]),
        }
        return df, meta

    @staticmethod
    def _read_csv_with_fallback(file_bytes: bytes) -> pd.DataFrame:
        """Tries multiple encodings and delimiters safely."""
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        delimiters = [",", ";", "\t", "|"]
        
        # Sample first 64KB for sniffer
        sample = file_bytes[:65536]
        detected_sep = ","
        detected_encoding = "utf-8"

        for enc in encodings:
            try:
                sample_str = sample.decode(enc)
                detected_encoding = enc
                try:
                    dialect = csv.Sniffer().sniff(sample_str, delimiters=";,|\t,")
                    detected_sep = dialect.delimiter
                except Exception:
                    # Fallback delimiter counting
                    lines = sample_str.splitlines()[:10]
                    if lines:
                        counts = {d: sum(line.count(d) for line in lines) for d in delimiters}
                        detected_sep = max(counts, key=counts.get)
                        if counts[detected_sep] == 0:
                            detected_sep = ","
                break
            except UnicodeDecodeError:
                continue

        try:
            return pd.read_csv(
                io.BytesIO(file_bytes),
                sep=detected_sep,
                encoding=detected_encoding,
                low_memory=False
            )
        except Exception as e:
            # Final fallback with python engine
            try:
                return pd.read_csv(
                    io.BytesIO(file_bytes),
                    sep=None,
                    engine="python",
                    encoding="latin-1"
                )
            except Exception as inner_e:
                raise DatasetValidationError(f"Could not parse CSV file: {str(e)} / {str(inner_e)}")

    @classmethod
    def inspect_dataset(cls, df: pd.DataFrame, target_column: Optional[str] = None) -> Dict[str, Any]:
        """
        Inspect dataset properties and calculate comprehensive, strictly real statistics.
        """
        row_count = int(df.shape[0])
        col_count = int(df.shape[1])
        duplicate_rows = int(df.duplicated().sum())

        numeric_cols = []
        categorical_cols = []
        columns_info = []

        total_missing = 0

        for col in df.columns:
            series = df[col]
            missing_count = int(series.isna().sum())
            total_missing += missing_count
            missing_pct = round((missing_count / row_count) * 100, 2) if row_count > 0 else 0.0
            unique_count = int(series.nunique(dropna=True))

            is_numeric = pd.api.types.is_numeric_dtype(series)
            if is_numeric and unique_count > 2:
                numeric_cols.append(col)
            else:
                categorical_cols.append(col)

            # Sample values (first 5 non-null values)
            valid_series = series.dropna()
            samples = [
                float(x) if isinstance(x, (np.floating, float)) and not np.isnan(x)
                else int(x) if isinstance(x, (np.integer, int))
                else str(x)
                for x in valid_series.iloc[:5].tolist()
            ]

            col_meta: Dict[str, Any] = {
                "name": col,
                "dtype": str(series.dtype),
                "is_numeric": is_numeric,
                "missing_count": missing_count,
                "missing_percentage": missing_pct,
                "unique_values": unique_count,
                "sample_values": samples,
            }

            if is_numeric and len(valid_series) > 0:
                col_meta["stats"] = {
                    "min": float(np.round(valid_series.min(), 4)),
                    "max": float(np.round(valid_series.max(), 4)),
                    "mean": float(np.round(valid_series.mean(), 4)),
                    "std": float(np.round(valid_series.std(), 4)) if len(valid_series) > 1 else 0.0,
                    "median": float(np.round(valid_series.median(), 4)),
                }
            else:
                top_counts = valid_series.value_counts().head(5).to_dict()
                col_meta["top_categories"] = {str(k): int(v) for k, v in top_counts.items()}

            columns_info.append(col_meta)

        # Target column inspection if specified
        target_info = None
        if target_column:
            target_info = cls.validate_and_inspect_target(df, target_column)

        return {
            "row_count": row_count,
            "column_count": col_count,
            "feature_count": col_count - 1 if target_column else col_count,
            "duplicate_rows": duplicate_rows,
            "total_missing_values": total_missing,
            "numeric_features": numeric_cols,
            "categorical_features": categorical_cols,
            "columns": columns_info,
            "target_info": target_info,
        }

    @classmethod
    def validate_and_inspect_target(cls, df: pd.DataFrame, target_column: str) -> Dict[str, Any]:
        """
        Validates target column suitability for classification and calculates real class distributions.
        """
        if target_column not in df.columns:
            raise DatasetValidationError(f"Target column '{target_column}' does not exist in dataset.")

        series = df[target_column].dropna()
        if len(series) == 0:
            raise DatasetValidationError(f"Target column '{target_column}' contains only missing values.")

        unique_vals = series.unique()
        num_classes = len(unique_vals)

        if num_classes < 2:
            raise DatasetValidationError(
                f"Target column '{target_column}' contains only {num_classes} unique class ({list(unique_vals)}). "
                "Classification requires at least 2 distinct classes."
            )

        # Guard against continuous regression targets
        if pd.api.types.is_float_dtype(series) and num_classes > 20:
            raise DatasetValidationError(
                f"Target column '{target_column}' appears to be a continuous numerical variable "
                f"with {num_classes} distinct floating values. This platform is designed for classification tasks."
            )

        # Class distribution
        counts = series.value_counts().to_dict()
        total = len(series)
        distribution = [
            {
                "class_name": str(cls_name),
                "count": int(count),
                "percentage": round((int(count) / total) * 100, 2)
            }
            for cls_name, count in counts.items()
        ]

        return {
            "target_column": target_column,
            "num_classes": num_classes,
            "classes": [str(c) for c in counts.keys()],
            "distribution": distribution,
            "is_binary": num_classes == 2,
            "imbalance_ratio": round(max(counts.values()) / min(counts.values()), 2) if min(counts.values()) > 0 else None,
        }
