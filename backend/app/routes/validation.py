class ValidationError(Exception):
    def __init__(self, errors):
        super().__init__("Invalid input")
        self.errors = errors


def number(data, key, errors, lo=None, hi=None, default=None, required=True):
    """Read a numeric value from request JSON, recording an error message if invalid."""
    value = data.get(key, default)
    if value is None or value == "":
        if required:
            errors[key] = "is required"
        return default
    try:
        value = float(value)
    except (TypeError, ValueError):
        errors[key] = "must be a number"
        return default
    if (lo is not None and value < lo) or (hi is not None and value > hi):
        errors[key] = f"must be between {lo} and {hi}"
    return int(value) if value.is_integer() else value
