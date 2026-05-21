// components/part-data.jsx — Mock parts data + helpers for Master Part

function genBarcode(t, n, b, bk) {
  if (!t) return null;
  const tn = t.charCodeAt(0) - 64;
  return `${tn}${n}${String(b).padStart(2,'0')}${String(bk).padStart(3,'0')}`;
}

function fmtStorage(p) {
  if (!p.sType) return '—';
  return `${p.sType}-${p.sNum}-${String(p.sBox).padStart(2,'0')}-${String(p.sBK).padStart(3,'0')}`;
}

function stockStatus(p) {
  if (p.status === 'unassigned') return 'unassigned';
  if (p.status === 'inactive') return 'inactive';
  if (p.curStock === 0) return 'out_of_stock';
  if (p.curStock < p.minStock) return 'low_stock';
  return 'available';
}

const _P = [
  // [id, code, name, maker, type, category, unit, sType,sNum,sBox,sBK, curStock,min,std,max, status, updBy, updAt]
  [1,'MIA-EL-001','Fuse 10A 250V','Bussmann','electrical','Protection','PCS','A',1,1,1, 0,10,15,20,'active','Aldi Nugroho','2026-05-14'],
  [2,'MIA-EL-002','Kontaktor LC1D18','Schneider','electrical','Contactor','PCS','A',1,1,2, 2,10,15,20,'active','Aldi Nugroho','2026-05-14'],
  [3,'MIA-EL-003','PLC Modul Input 16DI','Mitsubishi','electrical','PLC','PCS','A',1,1,3, 8,5,8,12,'active','Budi Santoso','2026-05-13'],
  [4,'MIA-EL-004','Relay Omron MY2N','Omron','electrical','Relay','PCS','A',1,1,4, 3,15,20,30,'active','Aldi Nugroho','2026-05-13'],
  [5,'MIA-EL-005','Terminal Block 4mm²','Phoenix Contact','electrical','Terminal','PCS','A',1,2,1, 5,20,30,50,'active','Aldi Nugroho','2026-05-14'],
  [6,'MIA-EL-006','Sensor Proximity M12','Keyence','electrical','Sensor','PCS','A',1,2,2, 12,5,10,15,'active','Budi Santoso','2026-05-12'],
  [7,'MIA-EL-007','MCB 16A 1P','Schneider','electrical','Protection','PCS','A',1,2,3, 18,10,15,25,'active','Aldi Nugroho','2026-05-11'],
  [8,'MIA-EL-008','Power Supply 24V 5A','Mean Well','electrical','Power Supply','PCS','A',1,2,4, 4,3,5,8,'active','Candra Putra','2026-05-10'],
  [9,'MIA-EL-009','Inverter 1.5kW FR-D720','Mitsubishi','electrical','Drive','PCS','A',1,3,1, 2,2,3,5,'active','Aldi Nugroho','2026-05-10'],
  [10,'MIA-EL-010','Timer Relay H3CR-A','Omron','electrical','Timer','PCS','A',1,3,2, 6,5,8,12,'active','Budi Santoso','2026-05-09'],
  [11,'MIA-EL-011','Photoelectric Sensor PQ-RD21','Keyence','electrical','Sensor','PCS','A',1,3,3, 0,3,5,8,'active','Aldi Nugroho','2026-05-08'],
  [12,'MIA-EL-012','Cable Duct 40x40','Panduit','electrical','Wiring','MTR','A',1,3,4, 25,10,20,40,'active','Candra Putra','2026-05-08'],

  [13,'MIA-ME-001','Bearing SKF 6205','SKF','mechanical','Bearing','PCS','B',1,1,1, 15,10,20,30,'active','Aldi Nugroho','2026-05-14'],
  [14,'MIA-ME-002','O-Ring NBR 30mm','NOK','mechanical','Seal','PCS','B',1,1,2, 8,25,40,60,'active','Budi Santoso','2026-05-13'],
  [15,'MIA-ME-003','Fitting AS1002F','SMC','mechanical','Fitting','PCS','B',1,1,3, 20,15,25,40,'active','Aldi Nugroho','2026-05-14'],
  [16,'MIA-ME-004','Cylinder SC 40x100','SMC','mechanical','Pneumatic','PCS','B',1,1,4, 3,2,4,6,'active','Candra Putra','2026-05-12'],
  [17,'MIA-ME-005','Belt Timing HTD 5M-450','Gates','mechanical','Belt','PCS','B',1,2,1, 1,5,8,12,'active','Aldi Nugroho','2026-05-11'],
  [18,'MIA-ME-006','Coupling Jaw L-100','Lovejoy','mechanical','Coupling','PCS','B',1,2,2, 4,3,5,8,'active','Budi Santoso','2026-05-10'],
  [19,'MIA-ME-007','Linear Guide HGH 20CA','HIWIN','mechanical','Guide','PCS','B',1,2,3, 2,2,4,6,'active','Aldi Nugroho','2026-05-09'],
  [20,'MIA-ME-008','Ball Screw SFU1605-500','TBI Motion','mechanical','Screw','PCS','B',1,2,4, 1,1,2,4,'active','Candra Putra','2026-05-08'],
  [21,'MIA-ME-009','Spring Compression 20x40','Misumi','mechanical','Spring','PCS','B',1,3,1, 30,20,30,50,'active','Budi Santoso','2026-05-07'],
  [22,'MIA-ME-010','Solenoid Valve 5/2 SY3120','SMC','mechanical','Valve','PCS','B',1,3,2, 0,3,5,8,'active','Aldi Nugroho','2026-05-07'],

  [23,'MIA-FA-001','Majun / Lap Bersih','Local','fabrication','Consumable','KG','C',1,1,1, 1,15,25,40,'active','Aldi Nugroho','2026-05-14'],
  [24,'MIA-FA-002','Plate Aluminium A5052 3mm','Local','fabrication','Plate','LBR','C',1,1,2, 10,5,10,15,'active','Dimas Pratama','2026-05-12'],
  [25,'MIA-FA-003','Rod Stainless SUS304 Ø10','Local','fabrication','Rod','BTG','C',1,1,3, 6,4,8,12,'active','Aldi Nugroho','2026-05-11'],
  [26,'MIA-FA-004','Bracket Custom L-Type','Custom','fabrication','Bracket','PCS','C',1,1,4, 12,8,15,20,'active','Candra Putra','2026-05-10'],
  [27,'MIA-FA-005','Rubber Pad 50x50x10','Local','fabrication','Pad','PCS','C',1,2,1, 22,10,20,30,'active','Budi Santoso','2026-05-09'],

  // Unassigned
  [28,'MIA-UN-001','Limit Switch TZ-8104','Tend','electrical','Switch','PCS',null,null,null,null, 0,5,8,12,'unassigned','Aldi Nugroho','2026-05-14'],
  [29,'MIA-UN-002','Hydraulic Seal Kit 40mm','Parker','mechanical','Seal','SET',null,null,null,null, 0,3,5,8,'unassigned','Aldi Nugroho','2026-05-13'],

  // Inactive
  [30,'MIA-EL-099','Relay Module G2R-2 (Discontinued)','Omron','electrical','Relay','PCS','A',1,4,1, 0,0,0,0,'inactive','Aldi Nugroho','2026-04-20'],
];

const PARTS_DATA = _P.map(r => {
  const p = {
    id: String(r[0]), partCode: r[1], partName: r[2], maker: r[3], type: r[4],
    category: r[5], unit: r[6], sType: r[7], sNum: r[8], sBox: r[9], sBK: r[10],
    curStock: r[11], minStock: r[12], stdStock: r[13], maxStock: r[14],
    status: r[15], updatedBy: r[16], updatedAt: r[17],
  };
  p.barcode = genBarcode(p.sType, p.sNum, p.sBox, p.sBK);
  p.stockStatus = stockStatus(p);
  p.storageAddr = fmtStorage(p);
  return p;
});

const ALL_MAKERS = [...new Set(PARTS_DATA.map(p => p.maker))].sort();
const ALL_CATEGORIES = [...new Set(PARTS_DATA.map(p => p.category))].sort();

// Mock purchase records for detail view
const MOCK_PURCHASES = [
  { id:'1', partId:'2', date:'2026-04-01', status:'received', supplier:'PT Schneider Electric', po:'PO-2026-0412', qty:10, eta:'2026-04-15', received:'2026-04-14', notes:'Regular restock' },
  { id:'2', partId:'2', date:'2026-03-01', status:'received', supplier:'PT Schneider Electric', po:'PO-2026-0298', qty:5, eta:'2026-03-20', received:'2026-03-18', notes:'' },
  { id:'3', partId:'1', date:'2026-05-10', status:'on_order', supplier:'PT Fuse Indonesia', po:'PO-2026-0501', qty:20, eta:'2026-05-25', received:null, notes:'Urgent restock' },
  { id:'4', partId:'5', date:'2026-05-12', status:'requested', supplier:'', po:'', qty:50, eta:'', received:null, notes:'Low stock alert' },
];

// Mock movement history for detail view
const MOCK_MOVEMENTS = [
  { id:'1', partId:'2', type:'OUT', qty:3, before:5, after:2, requestor:'Budi Santoso', inputer:'ADM001', project:'Line 3 Maintenance', date:'2026-05-14 08:50' },
  { id:'2', partId:'2', type:'IN', qty:10, before:5, after:15, requestor:'Aldi Nugroho', inputer:'ADM001', project:'', date:'2026-04-14 10:30' },
  { id:'3', partId:'1', type:'OUT', qty:5, before:5, after:0, requestor:'Dimas Pratama', inputer:'ADM001', project:'Line 1 Repair', date:'2026-05-10 14:20' },
  { id:'4', partId:'1', type:'OUT', qty:3, before:8, after:5, requestor:'Eko Wibowo', inputer:'ADM002', project:'Line 2 PM', date:'2026-05-05 09:15' },
  { id:'5', partId:'15', type:'IN', qty:5, before:15, after:20, requestor:'Aldi Nugroho', inputer:'ADM001', project:'', date:'2026-05-14 09:15' },
  { id:'6', partId:'13', type:'OUT', qty:2, before:17, after:15, requestor:'Candra Putra', inputer:'ADM001', project:'Jig Assembly', date:'2026-05-13 11:00' },
];

Object.assign(window, { PARTS_DATA, ALL_MAKERS, ALL_CATEGORIES, MOCK_PURCHASES, MOCK_MOVEMENTS });
