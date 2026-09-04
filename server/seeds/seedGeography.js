/**
 * Seed Hierarchical Geographic Entities for Andhra Pradesh
 * Administrative Structure: State -> District -> Parliament -> Assembly Constituency -> Mandal/Area
 */
const Area = require('../models/Area');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const IssueCategory = require('../models/IssueCategory');

async function seedGeographyHierarchy() {
  console.log('--- Seeding Hierarchical Geographic Entities for Andhra Pradesh ---');

  // 1. STATE: Andhra Pradesh
  let state = await Area.findOne({ code: 'AP-STATE' });
  if (!state) {
    state = await Area.create({
      name: 'Andhra Pradesh',
      displayName: 'Andhra Pradesh State',
      code: 'AP-STATE',
      type: 'STATE',
      parentId: null,
      ancestorIds: [],
      state: 'Andhra Pradesh',
      coordinates: { lat: 16.5062, lng: 80.6480 },
      description: 'State Level Command Center'
    });
  }

  // 2. DISTRICTS & PARLIAMENTS CONFIGURATION
  const HIERARCHY_TREE = [
    {
      districtName: 'Konaseema',
      districtCode: 'AP-DIS-KONA',
      coordinates: { lat: 16.5787, lng: 82.0061 },
      parliaments: [
        {
          name: 'Amalapuram Parliament',
          code: 'AP-PC-AMAL',
          coordinates: { lat: 16.5787, lng: 82.0061 },
          constituencies: [
            {
              name: '42 Ramachandrapuram',
              code: 'AP-AC-42',
              coordinates: { lat: 16.8524, lng: 82.0253 },
              mandals: [
                { name: 'Kajuluru', code: 'AP-MAN-KAJ', coordinates: { lat: 16.8200, lng: 82.1100 } },
                { name: 'Ramachandrapuram', code: 'AP-MAN-RCP', coordinates: { lat: 16.8524, lng: 82.0253 } },
                { name: 'Pamarru', code: 'AP-MAN-PAM', coordinates: { lat: 16.8800, lng: 82.0100 } }
              ]
            },
            {
              name: '43 Mummidivaram',
              code: 'AP-AC-43',
              coordinates: { lat: 16.6500, lng: 82.1167 },
              mandals: [
                { name: 'Polavaram', code: 'AP-MAN-POL-K', coordinates: { lat: 16.6200, lng: 82.1400 } },
                { name: 'Mummidivaram', code: 'AP-MAN-MUM', coordinates: { lat: 16.6500, lng: 82.1167 } },
                { name: 'Thallarevu', code: 'AP-MAN-THA', coordinates: { lat: 16.7800, lng: 82.1600 } },
                { name: 'Katrenikona', code: 'AP-MAN-KAT', coordinates: { lat: 16.5800, lng: 82.1200 } }
              ]
            },
            {
              name: '44 Amalapuram (SC)',
              code: 'AP-AC-44',
              coordinates: { lat: 16.5787, lng: 82.0061 },
              mandals: [
                { name: 'Uppalaguptam', code: 'AP-MAN-UPP', coordinates: { lat: 16.5400, lng: 82.0800 } },
                { name: 'Allavaram', code: 'AP-MAN-ALL', coordinates: { lat: 16.5100, lng: 81.9900 } },
                { name: 'Amalapuram', code: 'AP-MAN-AML', coordinates: { lat: 16.5787, lng: 82.0061 } }
              ]
            },
            {
              name: '45 Razole (SC)',
              code: 'AP-AC-45',
              coordinates: { lat: 16.4500, lng: 81.8333 },
              mandals: [
                { name: 'Razole', code: 'AP-MAN-RAZ', coordinates: { lat: 16.4500, lng: 81.8333 } },
                { name: 'Malkipuram', code: 'AP-MAN-MAL', coordinates: { lat: 16.4200, lng: 81.8700 } }
              ]
            },
            {
              name: '46 Gannavaram (SC)',
              code: 'AP-AC-46',
              coordinates: { lat: 16.5500, lng: 81.9000 },
              mandals: [
                { name: 'P.Gannavaram', code: 'AP-MAN-PGAN', coordinates: { lat: 16.5500, lng: 81.9000 } },
                { name: 'Ambajipeta', code: 'AP-MAN-AMB', coordinates: { lat: 16.5900, lng: 81.9300 } }
              ]
            },
            {
              name: '47 Kothapeta',
              code: 'AP-AC-47',
              coordinates: { lat: 16.7167, lng: 81.8833 },
              mandals: [
                { name: 'Kothapeta', code: 'AP-MAN-KOTH', coordinates: { lat: 16.7167, lng: 81.8833 } },
                { name: 'Ravulapalem', code: 'AP-MAN-RAV', coordinates: { lat: 16.7500, lng: 81.8400 } }
              ]
            },
            {
              name: '48 Mandapeta',
              code: 'AP-AC-48',
              coordinates: { lat: 16.8667, lng: 81.9333 },
              mandals: [
                { name: 'Mandapeta', code: 'AP-MAN-MAND', coordinates: { lat: 16.8667, lng: 81.9333 } },
                { name: 'Alamuru', code: 'AP-MAN-ALA', coordinates: { lat: 16.7900, lng: 81.8900 } }
              ]
            }
          ]
        }
      ]
    },
    {
      districtName: 'East Godavari',
      districtCode: 'AP-DIS-EGOD',
      coordinates: { lat: 17.0005, lng: 81.8040 },
      parliaments: [
        {
          name: 'Rajahmundry Parliament',
          code: 'AP-PC-RJY',
          coordinates: { lat: 17.0005, lng: 81.8040 },
          constituencies: [
            { name: '40 Anaparthy', code: 'AP-AC-40', coordinates: { lat: 16.9300, lng: 81.9500 }, mandals: [] },
            { name: '49 Rajanagaram', code: 'AP-AC-49', coordinates: { lat: 17.0800, lng: 81.9000 }, mandals: [] },
            { name: '50 Rajahmundry City', code: 'AP-AC-50', coordinates: { lat: 17.0005, lng: 81.8040 }, mandals: [] },
            { name: '51 Rajahmundry Rural', code: 'AP-AC-51', coordinates: { lat: 16.9800, lng: 81.7800 }, mandals: [] },
            { name: '54 Kovvur (SC)', code: 'AP-AC-54', coordinates: { lat: 17.0100, lng: 81.7200 }, mandals: [] },
            { name: '55 Nidadavole', code: 'AP-AC-55', coordinates: { lat: 16.9000, lng: 81.6700 }, mandals: [] },
            { name: '66 Gopalapuram (SC)', code: 'AP-AC-66', coordinates: { lat: 17.1000, lng: 81.5400 }, mandals: [] }
          ]
        }
      ]
    },
    {
      districtName: 'Kakinada',
      districtCode: 'AP-DIS-KKD',
      coordinates: { lat: 16.9891, lng: 82.2475 },
      parliaments: [
        {
          name: 'Kakinada Parliament',
          code: 'AP-PC-KKD',
          coordinates: { lat: 16.9891, lng: 82.2475 },
          constituencies: [
            { name: '35 Tuni', code: 'AP-AC-35', coordinates: { lat: 17.3500, lng: 82.5500 }, mandals: [] },
            { name: '36 Prathipadu', code: 'AP-AC-36', coordinates: { lat: 17.2300, lng: 82.1900 }, mandals: [] },
            { name: '37 Pithapuram', code: 'AP-AC-37', coordinates: { lat: 17.1100, lng: 82.2500 }, mandals: [] },
            { name: '38 Kakinada Rural', code: 'AP-AC-38', coordinates: { lat: 16.9500, lng: 82.2200 }, mandals: [] },
            { name: '39 Peddapuram', code: 'AP-AC-39', coordinates: { lat: 17.0800, lng: 82.1300 }, mandals: [] },
            { name: '41 Kakinada City', code: 'AP-AC-41', coordinates: { lat: 16.9891, lng: 82.2475 }, mandals: [] },
            { name: '52 Jaggampeta', code: 'AP-AC-52', coordinates: { lat: 17.1700, lng: 81.9800 }, mandals: [] }
          ]
        }
      ]
    },
    {
      districtName: 'West Godavari',
      districtCode: 'AP-DIS-WGOD',
      coordinates: { lat: 16.5449, lng: 81.5212 },
      parliaments: [
        {
          name: 'Narsapuram Parliament',
          code: 'AP-PC-NARS',
          coordinates: { lat: 16.4411, lng: 81.7011 },
          constituencies: [
            { name: '56 Achanta', code: 'AP-AC-56', coordinates: { lat: 16.5900, lng: 81.8000 }, mandals: [] },
            { name: '57 Palakollu', code: 'AP-AC-57', coordinates: { lat: 16.5200, lng: 81.7300 }, mandals: [] },
            { name: '58 Narsapuram', code: 'AP-AC-58', coordinates: { lat: 16.4411, lng: 81.7011 }, mandals: [] },
            { name: '59 Bhimavaram', code: 'AP-AC-59', coordinates: { lat: 16.5449, lng: 81.5212 }, mandals: [] },
            { name: '60 Undi', code: 'AP-AC-60', coordinates: { lat: 16.5800, lng: 81.4600 }, mandals: [] },
            { name: '61 Tanuku', code: 'AP-AC-61', coordinates: { lat: 16.7500, lng: 81.6800 }, mandals: [] },
            { name: '62 Tadepalligudem', code: 'AP-AC-62', coordinates: { lat: 16.8100, lng: 81.5200 }, mandals: [] }
          ]
        }
      ]
    },
    {
      districtName: 'Eluru',
      districtCode: 'AP-DIS-ELR',
      coordinates: { lat: 16.7107, lng: 81.0952 },
      parliaments: [
        {
          name: 'Eluru Parliament',
          code: 'AP-PC-ELR',
          coordinates: { lat: 16.7107, lng: 81.0952 },
          constituencies: [
            { name: '63 Unguturu', code: 'AP-AC-63', coordinates: { lat: 16.8800, lng: 81.4200 }, mandals: [] },
            { name: '64 Denduluru', code: 'AP-AC-64', coordinates: { lat: 16.7600, lng: 81.1600 }, mandals: [] },
            { name: '65 Eluru', code: 'AP-AC-65', coordinates: { lat: 16.7107, lng: 81.0952 }, mandals: [] },
            { name: '67 Polavaram (ST)', code: 'AP-AC-67', coordinates: { lat: 17.2500, lng: 81.6400 }, mandals: [] },
            { name: '68 Chintalapudi (SC)', code: 'AP-AC-68', coordinates: { lat: 17.0700, lng: 80.9900 }, mandals: [] },
            { name: '70 Nuzvid', code: 'AP-AC-70', coordinates: { lat: 16.7800, lng: 80.8500 }, mandals: [] },
            { name: '73 Kaikalur', code: 'AP-AC-73', coordinates: { lat: 16.5600, lng: 81.2100 }, mandals: [] }
          ]
        }
      ]
    }
  ];

  const allAreasMap = {};

  for (const distData of HIERARCHY_TREE) {
    // Upsert District
    let district = await Area.findOne({ code: distData.districtCode });
    if (!district) {
      district = await Area.create({
        name: distData.districtName,
        displayName: `${distData.districtName} District`,
        code: distData.districtCode,
        type: 'DISTRICT',
        parentId: state._id,
        ancestorIds: [state._id],
        state: 'Andhra Pradesh',
        district: distData.districtName,
        coordinates: distData.coordinates
      });
    }
    allAreasMap[distData.districtCode] = district;

    for (const parlData of distData.parliaments) {
      // Upsert Parliament
      let parliament = await Area.findOne({ code: parlData.code });
      if (!parliament) {
        parliament = await Area.create({
          name: parlData.name,
          displayName: parlData.name,
          code: parlData.code,
          type: 'PARLIAMENT',
          parentId: district._id,
          ancestorIds: [state._id, district._id],
          state: 'Andhra Pradesh',
          district: distData.districtName,
          parliament: parlData.name,
          coordinates: parlData.coordinates
        });
      }
      allAreasMap[parlData.code] = parliament;

      for (const constData of parlData.constituencies) {
        // Upsert Assembly Constituency
        let constituency = await Area.findOne({ code: constData.code });
        if (!constituency) {
          constituency = await Area.create({
            name: constData.name,
            displayName: `${constData.name} Constituency`,
            code: constData.code,
            type: 'ASSEMBLY_CONSTITUENCY',
            parentId: parliament._id,
            ancestorIds: [state._id, district._id, parliament._id],
            state: 'Andhra Pradesh',
            district: distData.districtName,
            parliament: parlData.name,
            assemblyConstituency: constData.name,
            coordinates: constData.coordinates
          });
        }
        allAreasMap[constData.code] = constituency;

        // Upsert Mandals if defined
        if (constData.mandals && constData.mandals.length > 0) {
          for (const manData of constData.mandals) {
            let mandal = await Area.findOne({ code: manData.code });
            if (!mandal) {
              mandal = await Area.create({
                name: manData.name,
                displayName: `${manData.name} Mandal`,
                code: manData.code,
                type: 'MANDAL',
                parentId: constituency._id,
                ancestorIds: [state._id, district._id, parliament._id, constituency._id],
                state: 'Andhra Pradesh',
                district: distData.districtName,
                parliament: parlData.name,
                assemblyConstituency: constData.name,
                mandal: manData.name,
                coordinates: manData.coordinates
              });
            }
            allAreasMap[manData.code] = mandal;
          }
        }
      }
    }
  }

  console.log('✓ Seeded Andhra Pradesh Administrative Hierarchy tree successfully.');
  return allAreasMap;
}

/**
 * Seed Dynamic Realistic Demo Complaints matching the Hierarchy Tree
 */
async function seedDemonstrationComplaints(areasMap) {
  console.log('--- Seeding Realistic Demo Complaints for Hierarchy ---');

  const citizen = await User.findOne({ role: 'CITIZEN' });
  const admin = await User.findOne({ role: 'ADMIN' });
  const categories = await IssueCategory.find().populate('defaultDepartment');
  const departments = await Department.find();

  if (!citizen || categories.length === 0 || departments.length === 0) {
    console.log('Skipping complaints seeding: users/departments not ready');
    return;
  }

  const potholeCat = categories.find((c) => c.slug === 'pothole') || categories[0];
  const garbageCat = categories.find((c) => c.slug === 'garbage') || categories[1] || categories[0];
  const streetlightCat = categories.find((c) => c.slug === 'streetlight') || categories[2] || categories[0];
  const waterCat = categories.find((c) => c.slug === 'water-leak') || categories[3] || categories[0];
  const drainageCat = categories.find((c) => c.slug === 'drainage') || categories[4] || categories[0];

  const roadDept = departments.find((d) => d.code === 'ROAD_MAINT') || departments[0];
  const sanitationDept = departments.find((d) => d.code === 'SANITATION') || departments[1] || departments[0];
  const electricalDept = departments.find((d) => d.code === 'ELECTRICAL') || departments[2] || departments[0];
  const waterDept = departments.find((d) => d.code === 'WATER_SUPPLY') || departments[3] || departments[0];
  const drainageDept = departments.find((d) => d.code === 'DRAINAGE') || departments[4] || departments[0];

  // Helper to create complaint in an area
  const createDemoIssue = async (area, title, desc, cat, dept, priority, status, slaDuration = 24, hoursAgo = 2) => {
    const createdAt = new Date(Date.now() - hoursAgo * 3600 * 1000);
    const deadline = new Date(createdAt.getTime() + slaDuration * 3600 * 1000);
    const isResolved = status === 'RESOLVED' || status === 'CLOSED';
    const isOverdue = !isResolved && Date.now() > deadline.getTime();

    const comp = await Complaint.create({
      complaintId: `CIV-AP-${Math.floor(100000 + Math.random() * 900000)}`,
      citizen: citizen._id,
      title,
      description: desc,
      image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
      category: cat._id,
      categoryName: cat.name,
      suggestedDepartment: dept._id,
      assignedDepartment: dept._id,
      departmentName: dept.name,
      priority,
      status,
      location: {
        type: 'Point',
        coordinates: [area.coordinates.lng + (Math.random() - 0.5) * 0.01, area.coordinates.lat + (Math.random() - 0.5) * 0.01]
      },
      address: `${title} near Market Road, ${area.name}`,
      geographicRegion: area._id,
      ancestorRegions: [...(area.ancestorIds || []), area._id],
      regionName: area.name,
      reportedAt: createdAt,
      expectedResolutionAt: deadline,
      slaDuration,
      slaStatus: isResolved ? 'RESOLVED_ON_TIME' : isOverdue ? 'OVERDUE' : 'ON_TRACK',
      resolvedAt: isResolved ? new Date(createdAt.getTime() + 12 * 3600 * 1000) : null,
      timeline: [
        {
          status: 'SUBMITTED',
          message: `Reported in ${area.name}. SLA Target: ${slaDuration}h.`,
          actorName: citizen.name,
          actorRole: 'CITIZEN',
          actionType: 'COMPLAINT_CREATED',
          timestamp: createdAt
        }
      ]
    });
    return comp;
  };

  // 1. Seed issues in 43 Mummidivaram Mandals (Polavaram: 6, Mummidivaram: 12, Thallarevu: 7, Katrenikona: 3)
  const polavaram = areasMap['AP-MAN-POL-K'] || await Area.findOne({ code: 'AP-MAN-POL-K' });
  const mummidivaramMandal = areasMap['AP-MAN-MUM'] || await Area.findOne({ code: 'AP-MAN-MUM' });
  const thallarevu = areasMap['AP-MAN-THA'] || await Area.findOne({ code: 'AP-MAN-THA' });
  const katrenikona = areasMap['AP-MAN-KAT'] || await Area.findOne({ code: 'AP-MAN-KAT' });

  if (polavaram) {
    for (let i = 1; i <= 6; i++) {
      await createDemoIssue(polavaram, `Polavaram Road Issue #${i}`, 'Road damaged after rains', potholeCat, roadDept, i <= 2 ? 'CRITICAL' : 'MEDIUM', 'IN_PROGRESS', 24, 6);
    }
  }

  if (mummidivaramMandal) {
    // 12 issues in Mummidivaram Mandal: mix of categories
    await createDemoIssue(mummidivaramMandal, 'Main Bypass Crater Pothole', 'Deep crater pothole', potholeCat, roadDept, 'CRITICAL', 'IN_PROGRESS', 12, 1);
    await createDemoIssue(mummidivaramMandal, 'Temple Street Potholes', 'Multiple potholes near junction', potholeCat, roadDept, 'HIGH', 'ASSIGNED', 24, 4);
    await createDemoIssue(mummidivaramMandal, 'Market Waste Dump', 'Garbage accumulation near vegetable market', garbageCat, sanitationDept, 'HIGH', 'IN_PROGRESS', 24, 5);
    await createDemoIssue(mummidivaramMandal, 'Bus Station Trash Overfill', 'Overflowing community bins', garbageCat, sanitationDept, 'MEDIUM', 'SUBMITTED', 48, 8);
    await createDemoIssue(mummidivaramMandal, 'Colony Waste Heap', 'Uncleared domestic garbage', garbageCat, sanitationDept, 'MEDIUM', 'RESOLVED', 24, 30);
    await createDemoIssue(mummidivaramMandal, 'High Street Transformer Spark', 'Flickering streetlights and sparking fuse', streetlightCat, electricalDept, 'CRITICAL', 'ASSIGNED', 12, 2);
    await createDemoIssue(mummidivaramMandal, 'Dark Alley Streetlight Outage', '4 non-functioning pole lights', streetlightCat, electricalDept, 'MEDIUM', 'IN_PROGRESS', 24, 10);
    await createDemoIssue(mummidivaramMandal, 'Substation Pole Light Broken', 'Broken fixture on main line', streetlightCat, electricalDept, 'LOW', 'RESOLVED', 48, 40);
    await createDemoIssue(mummidivaramMandal, 'Pipeline Leakage on Ward 3', 'Drinking water supply line burst', waterCat, waterDept, 'HIGH', 'IN_PROGRESS', 12, 3);
    await createDemoIssue(mummidivaramMandal, 'Low Pressure Supply Line', 'Valve blockage causing dry taps', waterCat, waterDept, 'MEDIUM', 'RESOLVED', 24, 36);
    await createDemoIssue(mummidivaramMandal, 'Open Drain Overflowing', 'Clogged concrete drain near bridge', drainageCat, drainageDept, 'HIGH', 'IN_PROGRESS', 24, 6);
    await createDemoIssue(mummidivaramMandal, 'Stagnant Stormwater Silt', 'Silt accumulation during monsoons', drainageCat, drainageDept, 'MEDIUM', 'RESOLVED', 48, 50);
  }

  if (thallarevu) {
    for (let i = 1; i <= 7; i++) {
      const cat = i <= 3 ? garbageCat : i <= 5 ? streetlightCat : waterCat;
      const dept = i <= 3 ? sanitationDept : i <= 5 ? electricalDept : waterDept;
      await createDemoIssue(thallarevu, `Thallarevu Civic Concern #${i}`, 'Public infrastructure issue reported', cat, dept, 'MEDIUM', i % 3 === 0 ? 'RESOLVED' : 'IN_PROGRESS', 24, 8);
    }
  }

  if (katrenikona) {
    for (let i = 1; i <= 3; i++) {
      await createDemoIssue(katrenikona, `Katrenikona Field Issue #${i}`, 'Drainage and road maintenance need', drainageCat, drainageDept, 'HIGH', 'IN_PROGRESS', 24, 4);
    }
  }

  // 2. Seed issues across other Amalapuram Parliament Constituencies
  const ramachan = areasMap['AP-AC-42'] || await Area.findOne({ code: 'AP-AC-42' });
  const amalapuramAC = areasMap['AP-AC-44'] || await Area.findOne({ code: 'AP-AC-44' });
  const razole = areasMap['AP-AC-45'] || await Area.findOne({ code: 'AP-AC-45' });
  const gannavaram = areasMap['AP-AC-46'] || await Area.findOne({ code: 'AP-AC-46' });
  const kothapeta = areasMap['AP-AC-47'] || await Area.findOne({ code: 'AP-AC-47' });
  const mandapeta = areasMap['AP-AC-48'] || await Area.findOne({ code: 'AP-AC-48' });

  if (ramachan) {
    for (let i = 1; i <= 15; i++) {
      const cat = i % 2 === 0 ? potholeCat : garbageCat;
      const dept = i % 2 === 0 ? roadDept : sanitationDept;
      await createDemoIssue(ramachan, `Ramachandrapuram Issue #${i}`, 'Constituency road and sanitation issue', cat, dept, i <= 3 ? 'CRITICAL' : 'MEDIUM', i % 4 === 0 ? 'RESOLVED' : 'IN_PROGRESS', 24, 12);
    }
  }

  if (amalapuramAC) {
    for (let i = 1; i <= 20; i++) {
      const cat = i % 3 === 0 ? waterCat : i % 2 === 0 ? potholeCat : garbageCat;
      const dept = i % 3 === 0 ? waterDept : i % 2 === 0 ? roadDept : sanitationDept;
      await createDemoIssue(amalapuramAC, `Amalapuram Town Issue #${i}`, 'Municipal report in Amalapuram', cat, dept, i <= 5 ? 'HIGH' : 'LOW', i % 5 === 0 ? 'RESOLVED' : 'IN_PROGRESS', 24, 15);
    }
  }

  if (razole) {
    for (let i = 1; i <= 5; i++) {
      await createDemoIssue(razole, `Razole Delta Concern #${i}`, 'Bridge approach & canal maintenance', drainageCat, drainageDept, 'MEDIUM', 'IN_PROGRESS', 24, 7);
    }
  }

  if (gannavaram) {
    for (let i = 1; i <= 4; i++) {
      await createDemoIssue(gannavaram, `Gannavaram Road Issue #${i}`, 'Potholes on highway link', potholeCat, roadDept, 'HIGH', 'IN_PROGRESS', 24, 9);
    }
  }

  if (kothapeta) {
    for (let i = 1; i <= 4; i++) {
      await createDemoIssue(kothapeta, `Kothapeta Streetlight #${i}`, 'Illumination issue on market lane', streetlightCat, electricalDept, 'LOW', 'RESOLVED', 48, 25);
    }
  }

  if (mandapeta) {
    for (let i = 1; i <= 5; i++) {
      await createDemoIssue(mandapeta, `Mandapeta Sanitation #${i}`, 'Market waste disposal', garbageCat, sanitationDept, 'MEDIUM', 'IN_PROGRESS', 24, 14);
    }
  }

  // 3. Seed demo issues in other Parliaments (Rajahmundry, Kakinada, Narsapuram, Eluru)
  const rajahmundry = areasMap['AP-PC-RJY'] || await Area.findOne({ code: 'AP-PC-RJY' });
  const kakinada = areasMap['AP-PC-KKD'] || await Area.findOne({ code: 'AP-PC-KKD' });
  const narsapuram = areasMap['AP-PC-NARS'] || await Area.findOne({ code: 'AP-PC-NARS' });
  const eluru = areasMap['AP-PC-ELR'] || await Area.findOne({ code: 'AP-PC-ELR' });

  if (rajahmundry) {
    for (let i = 1; i <= 12; i++) {
      await createDemoIssue(rajahmundry, `Rajahmundry Urban Issue #${i}`, 'Urban infrastructure concern', potholeCat, roadDept, 'HIGH', 'IN_PROGRESS', 24, 10);
    }
  }
  if (kakinada) {
    for (let i = 1; i <= 10; i++) {
      await createDemoIssue(kakinada, `Kakinada Port City Issue #${i}`, 'Port road and lighting issue', streetlightCat, electricalDept, 'MEDIUM', 'IN_PROGRESS', 24, 10);
    }
  }
  if (narsapuram) {
    for (let i = 1; i <= 8; i++) {
      await createDemoIssue(narsapuram, `Narsapuram Coastal Issue #${i}`, 'Coastal road erosion & water supply', waterCat, waterDept, 'HIGH', 'IN_PROGRESS', 24, 10);
    }
  }
  if (eluru) {
    for (let i = 1; i <= 7; i++) {
      await createDemoIssue(eluru, `Eluru Canal Issue #${i}`, 'Canal bund drainage', drainageCat, drainageDept, 'MEDIUM', 'IN_PROGRESS', 24, 10);
    }
  }

  console.log('✓ Seeded realistic geographic complaints for all administrative regions.');
}

module.exports = {
  seedGeographyHierarchy,
  seedDemonstrationComplaints
};
