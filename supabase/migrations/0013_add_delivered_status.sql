-- Migration 0013: Add delivered value to fulfillment_status_enum

ALTER TYPE fulfillment_status_enum ADD VALUE IF NOT EXISTS 'delivered';
