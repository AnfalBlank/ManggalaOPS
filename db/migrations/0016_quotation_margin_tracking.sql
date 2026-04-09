-- Add unit_cost to quotation_items table
ALTER TABLE quotation_items ADD COLUMN unit_cost REAL DEFAULT 0;

-- Add margin tracking fields to quotations table
ALTER TABLE quotations ADD COLUMN subtotal_cost REAL DEFAULT 0;
ALTER TABLE quotations ADD COLUMN total_margin REAL DEFAULT 0;
ALTER TABLE quotations ADD COLUMN margin_percentage REAL DEFAULT 0;
