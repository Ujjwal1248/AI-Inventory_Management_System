-- =============================================================
-- Gemini Inventory — Sample Seed Data
-- Realistic retail products and sales for demo purposes.
-- =============================================================

-- ─── Products ────────────────────────────────────────────────
INSERT INTO products (name, sku, barcode, category, description, cost_price, selling_price, stock_quantity, minimum_stock, supplier, image_url, created_at) VALUES
-- Electronics
('Apple iPhone 15 128GB',          'EL-001', '890100100001', 'Electronics',   'Latest Apple smartphone with A16 chip and Dynamic Island',              55000,  79999,  45,  10, 'Apple India Pvt Ltd', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', NOW() - INTERVAL '90 days'),
('Samsung Galaxy S24 256GB',        'EL-002', '890100100002', 'Electronics',   'Android flagship with Snapdragon 8 Gen 3 and Galaxy AI',               48000,  74999,  30,  10, 'Samsung India Dist', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', NOW() - INTERVAL '85 days'),
('Sony WH-1000XM5 Headphones',      'EL-003', '890100100003', 'Electronics',   'Industry-leading noise cancelling wireless headphones with 30hr battery', 18000,  29999,   8,  10, 'Sony Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', NOW() - INTERVAL '80 days'),
('Apple iPad Air 11-inch',          'EL-004', '890100100004', 'Electronics',   'M2 chip tablet with Liquid Retina display and Touch ID',                42000,  64999,  20,   8, 'Apple India Pvt Ltd', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', NOW() - INTERVAL '75 days'),
('Logitech MX Master 3S Mouse',     'EL-005', '890100100005', 'Electronics',   'Quiet 8K DPI optical sensor performance wireless productivity mouse',    4500,   8499,  60,  15, 'Logitech Tech Dist', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', NOW() - INTERVAL '70 days'),
('Samsung 65" QLED 4K TV',          'EL-006', '890100100006', 'Electronics',   'Quantum dot 4K smart television with Object Tracking Sound',            65000, 110000,   5,   5, 'Samsung India Dist', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', NOW() - INTERVAL '65 days'),
('Bose SoundLink Flex Speaker',     'EL-007', '890100100007', 'Electronics',   'Portable waterproof Bluetooth speaker with PositionIQ technology',       9000,  14999,   3,   8, 'Bose Sound Systems', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400', NOW() - INTERVAL '60 days'),
('Dell XPS 15 Laptop',              'EL-008', '890100100008', 'Electronics',   'Intel Core i7, 16GB RAM, 512GB SSD OLED InfinityEdge Display',          75000, 120000,  12,   5, 'Dell Technologies', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400', NOW() - INTERVAL '55 days'),

-- Clothing
('Levi''s 511 Slim Jeans',          'CL-001', '890200100001', 'Clothing',      'Classic slim-fit stretch denim jeans with 5 pockets',                   1800,   3999,  80,  20, 'Levi Strauss India', 'https://images.unsplash.com/photo-1542272604-780c96856592?w=400', NOW() - INTERVAL '88 days'),
('Nike Air Max 270 Sneakers',       'CL-002', '890200100002', 'Clothing',      'Breathable mesh running and lifestyle sneakers with Max Air unit',       4500,   8999,  35,  15, 'Nike Sports Retail', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', NOW() - INTERVAL '82 days'),
('Adidas Classic Backpack',         'CL-003', '890200100003', 'Clothing',      '30L water-resistant durable polyester everyday backpack',               1200,   2499,   2,  10, 'Adidas Originals', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', NOW() - INTERVAL '77 days'),
('Ray-Ban Aviator Sunglasses',      'CL-004', '890200100004', 'Clothing',      'Classic metal frame polarized gradient UV protection sunglasses',        4000,   7999,  25,  10, 'Luxottica India', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400', NOW() - INTERVAL '72 days'),
('Puma Dri-FIT T-Shirt',           'CL-005', '890200100005', 'Clothing',      'Moisture-wicking breathable athletic short-sleeve crew neck',             350,    899, 120,  30, 'Puma India Retail', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400', NOW() - INTERVAL '67 days'),
('Woodland Trekking Boots',         'CL-006', '890200100006', 'Clothing',      'Genuine nubuck leather waterproof high-ankle all-terrain boots',         2800,   5499,  18,  10, 'Aero Club Woodland', 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400', NOW() - INTERVAL '62 days'),
('H&M Slim Fit Blazer',            'CL-007', '890200100007', 'Clothing',      'Modern tailored formal two-button single-breasted blazer',              2200,   4299,   0,  10, 'H&M Hennes & Mauritz', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400', NOW() - INTERVAL '57 days'),

-- Groceries
('Tata Salt 1kg',                   'GR-001', '890300100001', 'Groceries',     'Vacuum evaporated iodized crystal cooking salt',                          18,      35, 500,  50, 'Tata Consumer Products', 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400', NOW() - INTERVAL '30 days'),
('Amul Butter 500g',                'GR-002', '890300100002', 'Groceries',     'Pure pasteurized churned salted butter block',                            95,     260, 200,  50, 'Gujarat Coop Milk Marketing', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', NOW() - INTERVAL '28 days'),
('Aashirvaad Whole Wheat Flour 5kg','GR-003', '890300100003', 'Groceries',     '100% whole grain chakki atta with natural bran fiber',                   165,     280, 300,  60, 'ITC Agri Business', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', NOW() - INTERVAL '26 days'),
('Organic India Tulsi Green Tea',   'GR-004', '890300100004', 'Groceries',     'Stress-relieving certified organic herb & green tea (25 tea bags)',       85,     175, 150,  30, 'Organic India Ltd', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400', NOW() - INTERVAL '24 days'),
('Fortune Sunflower Oil 5L',        'GR-005', '890300100005', 'Groceries',     'Light and healthy triple refined sunflower cooking oil can',             480,     699, 180,  40, 'Adani Wilmar Ltd', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', NOW() - INTERVAL '22 days'),
('Maggi 2-Minute Noodles Pack of 12','GR-006','890300100006', 'Groceries',     'Classic masala tastemaker instant noodles family pack',                  130,     210, 400,  80, 'Nestle India Ltd', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400', NOW() - INTERVAL '20 days'),
('Haldiram Aloo Bhujia 400g',       'GR-007', '890300100007', 'Groceries',     'Spicy crunchy potato noodle snack with mint and spices',                  65,     120, 250,  50, 'Haldiram Snacks Pvt Ltd', 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400', NOW() - INTERVAL '18 days'),

-- Home & Kitchen
('Prestige Pressure Cooker 5L',     'HK-001', '890400100001', 'Home & Kitchen','Virgin aluminium inner-lid safety valve pressure cooker',                950,   1799,  40,  10, 'TTK Prestige Ltd', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400', NOW() - INTERVAL '86 days'),
('Philips Air Fryer HD9200',        'HK-002', '890400100002', 'Home & Kitchen','Rapid Air Technology 4.1L oil-free health fryer 1400W',                 4500,   7999,  15,   8, 'Philips Consumer Care', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400', NOW() - INTERVAL '76 days'),
('Milton Thermosteel Flask 1L',     'HK-003', '890400100003', 'Home & Kitchen','Double-wall vacuum insulated hot & cold stainless steel bottle',         450,    899,  70,  20, 'Hamilton Housewares', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', NOW() - INTERVAL '66 days'),
('Cello Opalware Dinner Set 18pc',  'HK-004', '890400100004', 'Home & Kitchen','Microwave & dishwasher safe bone ash free dinnerware set',              1100,   1999,  22,  10, 'Cello World Ltd', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', NOW() - INTERVAL '56 days'),
('Bajaj Mixer Grinder 750W',        'HK-005', '890400100005', 'Home & Kitchen','Titanium motor with 3 stainless steel liquidizing and chutney jars',      2800,   4299,   7,   8, 'Bajaj Electricals', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400', NOW() - INTERVAL '46 days'),

-- Sports & Fitness
('Lifelong LLFIT Treadmill',        'SF-001', '890500100001', 'Sports & Fitness','2.5HP motorized fold-up treadmill with shock absorbing deck',         18000,  29999,   4,   3, 'Lifelong Online Retail', 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400', NOW() - INTERVAL '83 days'),
('Nivia Storm Football Size 5',     'SF-002', '890500100002', 'Sports & Fitness','Thermobonded textured PU leather official size match ball',           550,   1099,  55,  15, 'Freewill Sports Pvt Ltd', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', NOW() - INTERVAL '73 days'),
('Cosco Badminton Racket Set',      'SF-003', '890500100003', 'Sports & Fitness','Isometric carbon-aluminium alloy 2 rackets with 3 feather shuttles', 750,   1499,  38,  12, 'Cosco India Ltd', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', NOW() - INTERVAL '63 days'),
('Boldfit Gym Gloves',              'SF-004', '890500100004', 'Sports & Fitness','Padded anti-slip palm with wrist support wrap for weightlifting',      280,    599,   0,  10, 'Boldfit Sports', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400', NOW() - INTERVAL '53 days'),
('Patanjali Yoga Mat 6mm',          'SF-005', '890500100005', 'Sports & Fitness','Dual-sided textured non-slip EVA eco-friendly meditation & yoga mat',   350,    699,  45,  12, 'Patanjali Ayurved Ltd', 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=400', NOW() - INTERVAL '43 days');

-- ─── Sales (last 12 months) ───────────────────────────────────
INSERT INTO sales (id, receipt_number, total_amount, created_at, payment_method, customer_name) VALUES
  (1,  'REC-000001', 164997, NOW() - INTERVAL '12 months' + INTERVAL '3 days', 'UPI',  'Rahul Sharma'),
  (2,  'REC-000002', 23697,  NOW() - INTERVAL '12 months' + INTERVAL '8 days', 'Card', 'Priya Patel'),
  (3,  'REC-000003', 310997, NOW() - INTERVAL '11 months' + INTERVAL '2 days', 'UPI',  'Amit Verma'),
  (4,  'REC-000004', 45596,  NOW() - INTERVAL '11 months' + INTERVAL '10 days','Cash', 'Neha Gupta'),
  (5,  'REC-000005', 95997,  NOW() - INTERVAL '10 months' + INTERVAL '5 days', 'Card', 'Vikram Singh'),
  (6,  'REC-000006', 22493,  NOW() - INTERVAL '10 months' + INTERVAL '15 days','Cash', 'Pooja Nair'),
  (7,  'REC-000007', 84998,  NOW() - INTERVAL '9 months' + INTERVAL '3 days',  'UPI',  'Sanjay Rao'),
  (8,  'REC-000008', 49995,  NOW() - INTERVAL '9 months' + INTERVAL '18 days', 'Card', 'Ananya Roy'),
  (9,  'REC-000009', 159998, NOW() - INTERVAL '8 months' + INTERVAL '6 days',  'UPI',  'Deepak Kumar'),
  (10, 'REC-000010', 39997,  NOW() - INTERVAL '8 months' + INTERVAL '20 days', 'Cash', 'Kavita Joshi'),
  (11, 'REC-000011', 243998, NOW() - INTERVAL '7 months' + INTERVAL '4 days',  'Card', 'Rohan Mehta'),
  (12, 'REC-000012', 69998,  NOW() - INTERVAL '7 months' + INTERVAL '14 days', 'UPI',  'Sunita Rao'),
  (13, 'REC-000013', 109998, NOW() - INTERVAL '6 months' + INTERVAL '7 days',  'UPI',  'Manish Tiwari'),
  (14, 'REC-000014', 55596,  NOW() - INTERVAL '6 months' + INTERVAL '22 days', 'Cash', 'Swati Deshmukh'),
  (15, 'REC-000015', 189998, NOW() - INTERVAL '5 months' + INTERVAL '2 days',  'Card', 'Arjun Kapoor'),
  (16, 'REC-000016', 34796,  NOW() - INTERVAL '5 months' + INTERVAL '16 days', 'Cash', 'Divya Reddy'),
  (17, 'REC-000017', 154998, NOW() - INTERVAL '4 months' + INTERVAL '5 days',  'UPI',  'Karthik Iyer'),
  (18, 'REC-000018', 68995,  NOW() - INTERVAL '4 months' + INTERVAL '19 days', 'Card', 'Meera Bhatt'),
  (19, 'REC-000019', 294997, NOW() - INTERVAL '3 months' + INTERVAL '3 days',  'UPI',  'Gaurav Jain'),
  (20, 'REC-000020', 47995,  NOW() - INTERVAL '3 months' + INTERVAL '17 days', 'Cash', 'Shilpa Sen'),
  (21, 'REC-000021', 219998, NOW() - INTERVAL '2 months' + INTERVAL '8 days',  'Card', 'Aditya Birla'),
  (22, 'REC-000022', 89995,  NOW() - INTERVAL '2 months' + INTERVAL '21 days', 'UPI',  'Tanvi Saxena'),
  (23, 'REC-000023', 339997, NOW() - INTERVAL '15 days',                       'Card', 'Rajesh Kothari'),
  (24, 'REC-000024', 157997, NOW() - INTERVAL '8 days',                        'UPI',  'Bhavna Shah'),
  (25, 'REC-000025', 34795,  NOW() - INTERVAL '3 days',                        'Cash', 'Nitin Gadkari');

SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales));

INSERT INTO sales (total_amount, created_at) VALUES (34795, NOW() - INTERVAL '3 days');
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES
  (25, 10, 2, 8999),
  (25, 12, 2, 7999),
  (25, 13, 5,  899);

-- ─── Stock Movements (Phase 3) ───────────────────────────────
INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason, created_at) VALUES
  -- Initial receipts
  (1,  'Stock received',     50, 0,  50, 'Supplier initial batch PO-2026-001',        NOW() - INTERVAL '89 days'),
  (1,  'Stock sold',         -5, 50, 45, 'Point of Sale transaction #ORD-00001',     NOW() - INTERVAL '40 days'),
  (2,  'Stock received',     35, 0,  35, 'Shipment arrived from Samsung India Dist',  NOW() - INTERVAL '84 days'),
  (2,  'Stock sold',         -5, 35, 30, 'Point of Sale transaction #ORD-00005',     NOW() - INTERVAL '20 days'),
  (3,  'Stock received',     12, 0,  12, 'Procurement order PO-2026-003',             NOW() - INTERVAL '79 days'),
  (3,  'Stock sold',         -4, 12,  8, 'Multiple customer sales orders',            NOW() - INTERVAL '15 days'),
  (5,  'Stock received',     70, 0,  70, 'Bulk delivery Logitech MX Series',          NOW() - INTERVAL '69 days'),
  (5,  'Stock sold',        -10, 70, 60, 'E-commerce and offline store checkout',     NOW() - INTERVAL '10 days'),
  (7,  'Stock received',     10, 0,  10, 'Supplier batch delivery Bose SoundLink',    NOW() - INTERVAL '59 days'),
  (7,  'Manual adjustment',  -7, 10,  3, 'Damaged during showroom display handling',  NOW() - INTERVAL '14 days'),
  (15, 'Stock received',     10, 0,  10, 'Initial inventory delivery',                NOW() - INTERVAL '56 days'),
  (15, 'Stock sold',        -10, 10,  0, 'Sold out during festive weekend clearance', NOW() - INTERVAL '5 days'),
  (16, 'Stock received',    600, 0, 600, 'Pallet delivery Tata Consumer Products',   NOW() - INTERVAL '29 days'),
  (16, 'Stock sold',       -100, 600, 500, 'Weekly grocery fulfillment orders',       NOW() - INTERVAL '12 days'),
  (17, 'Stock received',    250, 0, 250, 'Dairy cold storage shipment',               NOW() - INTERVAL '27 days'),
  (17, 'Manual adjustment', -50, 250, 200, 'Expired batch write-off from cold room',  NOW() - INTERVAL '7 days'),
  (18, 'Stock received',    350, 0, 350, 'Aashirvaad wheat flour replenishment',      NOW() - INTERVAL '25 days'),
  (18, 'Stock sold',        -50, 350, 300, 'Bulk grocery orders',                     NOW() - INTERVAL '6 days'),
  (27, 'Stock received',     10, 0,  10, 'Treadmill stock from Lifelong Retail',      NOW() - INTERVAL '82 days'),
  (27, 'Stock sold',         -6, 10,  4, 'Home gym customer orders delivered',        NOW() - INTERVAL '18 days'),
  (30, 'Stock received',      8, 0,   8, 'Initial gym gloves shipment',               NOW() - INTERVAL '52 days'),
  (30, 'Manual adjustment',  -8,  8,  0, 'Stock discrepancy audit - physical zero',   NOW() - INTERVAL '2 days'),
  (4,  'Stock returned',      1, 19, 20, 'Customer return - unopened seal intact',   NOW() - INTERVAL '1 day'),
  (9,  'Manual adjustment',  10, 70, 80, 'Physical inventory cycle count reconciliation', NOW() - INTERVAL '12 hours');

SELECT 'Seed data inserted successfully.' AS status;
