/**
 * A sample payout file, so the tool can be tried without uploading anything.
 *
 * Synthetic and clearly labelled as such in the UI. It is shaped like a Meesho
 * payout export and has a known set of planted problems, which doubles as the
 * fixture this tool is verified against:
 *
 *   row 13  settled ₹300 short of its own arithmetic
 *   row 14  settled ₹50 short of its own arithmetic
 *   row 15  commission at 25% against a 15% median
 *   row 16  delivered, nothing settled
 *   row 17  delivered, but a reverse-shipping charge pushed it negative
 *   row 18  cancelled and settled at zero — correct, and must NOT be flagged
 *   row 19  duplicate of row 3's order ID
 *   row 20  a genuine refund, negative by definition — must NOT be flagged
 */

export const SAMPLE_FILENAME = 'sample-payout.csv';

export const SAMPLE_CSV = `Sub Order No,Order Date,Live Order Status,Total Sale Amount,Commission,Shipping Charge,Fixed Fee,Final Settlement Amount
80421553301_1,2026-08-02,Delivered,599.00,89.85,55.00,12.00,442.15
80421553302_1,2026-08-02,Delivered,"1,299.00",194.85,65.00,12.00,"1,027.15"
80421553303_1,2026-08-03,Delivered,449.00,67.35,50.00,12.00,319.65
80421553304_1,2026-08-04,Delivered,899.00,134.85,55.00,12.00,697.15
80421553305_1,2026-08-05,Delivered,749.00,112.35,55.00,12.00,569.65
80421553306_1,2026-08-06,Delivered,"1,599.00",239.85,70.00,12.00,"1,277.15"
80421553307_1,2026-08-07,Delivered,349.00,52.35,50.00,12.00,234.65
80421553308_1,2026-08-08,Delivered,999.00,149.85,60.00,12.00,777.15
80421553309_1,2026-08-09,Delivered,"1,199.00",179.85,65.00,12.00,942.15
80421553310_1,2026-08-10,Delivered,529.00,79.35,50.00,12.00,387.65
80421553311_1,2026-08-11,Delivered,679.00,101.85,55.00,12.00,510.15
80421553312_1,2026-08-12,Delivered,"2,499.00",374.85,85.00,12.00,"2,027.15"
80421553313_1,2026-08-13,Delivered,"1,899.00",284.85,70.00,12.00,"1,232.15"
80421553314_1,2026-08-14,Delivered,849.00,127.35,55.00,12.00,604.65
80421553315_1,2026-08-15,Delivered,"1,499.00",374.75,70.00,12.00,"1,042.25"
80421553316_1,2026-08-16,Delivered,"1,099.00",164.85,60.00,12.00,0.00
80421553317_1,2026-08-17,Delivered,0.00,0.00,85.00,0.00,(85.00)
80421553318_1,2026-08-18,Cancelled,799.00,0.00,0.00,0.00,0.00
80421553303_1,2026-08-19,Delivered,449.00,67.35,50.00,12.00,319.65
80421553320_1,2026-08-20,Return,0.00,0.00,60.00,0.00,(60.00)
`;
