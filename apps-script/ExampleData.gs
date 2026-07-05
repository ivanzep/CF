/**
 * The La Costa Hotel example dataset, used by loadExampleData() in Code.gs.
 */
var EXAMPLE_DATA = {
  "categories": [
    {
      "name": "ACQUISITION",
      "sortOrder": 0
    },
    {
      "name": "PROJECT START-UP",
      "sortOrder": 1
    },
    {
      "name": "CONSTRUCTION AND FEES",
      "sortOrder": 2
    }
  ],
  "lineItems": [
    {
      "category": "ACQUISITION",
      "code": "1.00",
      "description": "LAND ACQUISITION",
      "totalBudget": 5395324,
      "scheduleMode": "CUSTOM",
      "startDate": null,
      "endDate": null,
      "sortOrder": 0,
      "payments": [
        {
          "date": "2025-11-01",
          "amount": 5395324
        }
      ]
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.01",
      "description": "PROJECT MANAGEMENT / DEVELOPER FEE (50%)",
      "totalBudget": 217000,
      "scheduleMode": "EVEN",
      "startDate": "2025-12-01",
      "endDate": "2026-05-01",
      "sortOrder": 0,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.01",
      "description": "GC FEE / CONSTRUCTION MANAGEMENT (5.8%)",
      "totalBudget": 890575,
      "scheduleMode": "EVEN",
      "startDate": "2026-09-01",
      "endDate": "2028-08-01",
      "sortOrder": 0,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.02",
      "description": "GENERAL CONDITIONS",
      "totalBudget": 150744,
      "scheduleMode": "EVEN",
      "startDate": "2026-09-01",
      "endDate": "2028-08-01",
      "sortOrder": 1,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.02",
      "description": "ARCHITECTURE AND INTERIORS",
      "totalBudget": 900000,
      "scheduleMode": "EVEN",
      "startDate": "2025-09-01",
      "endDate": "2026-10-01",
      "sortOrder": 1,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.03",
      "description": "PRECON",
      "totalBudget": 41465,
      "scheduleMode": "EVEN",
      "startDate": "2026-09-01",
      "endDate": "2028-08-01",
      "sortOrder": 2,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.03",
      "description": "CIVIL ENGINEER",
      "totalBudget": 24200,
      "scheduleMode": "EVEN",
      "startDate": "2025-01-01",
      "endDate": "2026-11-01",
      "sortOrder": 2,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.04",
      "description": "DRY UTILITIES",
      "totalBudget": 43800,
      "scheduleMode": "EVEN",
      "startDate": "2025-11-01",
      "endDate": "2026-09-01",
      "sortOrder": 3,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.04",
      "description": "STAFFING",
      "totalBudget": 482628,
      "scheduleMode": "EVEN",
      "startDate": "2026-09-01",
      "endDate": "2028-08-01",
      "sortOrder": 3,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.05",
      "description": "STRUCTURAL",
      "totalBudget": 43000,
      "scheduleMode": "EVEN",
      "startDate": "2025-12-01",
      "endDate": "2026-09-01",
      "sortOrder": 4,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.05",
      "description": "PROJECT MANAGEMENT / DEVELOPER FEE (50%)",
      "totalBudget": 217000,
      "scheduleMode": "EVEN",
      "startDate": "2026-09-01",
      "endDate": "2028-08-01",
      "sortOrder": 4,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.06",
      "description": "SIGNAGE / TRAFFIC / UTILITIES - MONTH 1",
      "totalBudget": 30000,
      "scheduleMode": "EVEN",
      "startDate": "2026-04-01",
      "endDate": "2027-12-01",
      "sortOrder": 5,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.06",
      "description": "MEP",
      "totalBudget": 72000,
      "scheduleMode": "EVEN",
      "startDate": "2025-12-01",
      "endDate": "2026-09-01",
      "sortOrder": 5,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.07",
      "description": "SITE TESTING AND INSPECTIONS",
      "totalBudget": 120000,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2027-12-01",
      "sortOrder": 6,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.07",
      "description": "PERMIT EXPEDITOR",
      "totalBudget": 11925,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2026-12-01",
      "sortOrder": 6,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.08",
      "description": "PERMIT ISSUANCE",
      "totalBudget": 77698,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2026-12-01",
      "sortOrder": 7,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.08",
      "description": "LANDSCAPE",
      "totalBudget": 72800,
      "scheduleMode": "EVEN",
      "startDate": "2025-10-01",
      "endDate": "2026-06-01",
      "sortOrder": 7,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.09",
      "description": "GEOTECH",
      "totalBudget": 3500,
      "scheduleMode": "EVEN",
      "startDate": "2025-01-01",
      "endDate": "2025-12-01",
      "sortOrder": 8,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.09",
      "description": "REAL ESTATE TAXES (50% OF TOTAL)",
      "totalBudget": 42988,
      "scheduleMode": "EVEN",
      "startDate": "2026-09-01",
      "endDate": "2028-08-01",
      "sortOrder": 8,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.10",
      "description": "KITCHEN DESIGN CONSULTANT",
      "totalBudget": 25000,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2026-12-01",
      "sortOrder": 9,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.10",
      "description": "MARKETING & ADVERTISING",
      "totalBudget": 77750,
      "scheduleMode": "EVEN",
      "startDate": "2026-09-01",
      "endDate": "2028-08-01",
      "sortOrder": 9,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.11",
      "description": "50% SOFT COST CONTINGENCY (5% OF TOTAL)",
      "totalBudget": 53132,
      "scheduleMode": "EVEN",
      "startDate": "2026-09-01",
      "endDate": "2028-08-01",
      "sortOrder": 10,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.11",
      "description": "AUDIO / VIDEO CONSULTANT",
      "totalBudget": 30000,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2026-12-01",
      "sortOrder": 10,
      "payments": []
    },
    {
      "category": "CONSTRUCTION AND FEES",
      "code": "2.12",
      "description": "CONSTRUCTION LOAN INTEREST",
      "totalBudget": 161200,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2026-12-01",
      "sortOrder": 11,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.13",
      "description": "ADMIN LEGAL",
      "totalBudget": 15000,
      "scheduleMode": "EVEN",
      "startDate": "2025-10-01",
      "endDate": "2026-06-01",
      "sortOrder": 11,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.14",
      "description": "PERMITS & FEES",
      "totalBudget": 210396,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2026-12-01",
      "sortOrder": 12,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.15",
      "description": "REAL ESTATE TAXES (50% OF TOTAL)",
      "totalBudget": 42988,
      "scheduleMode": "EVEN",
      "startDate": "2025-07-01",
      "endDate": "2026-12-01",
      "sortOrder": 13,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.16",
      "description": "INSURANCE & BONDS",
      "totalBudget": 500089,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2026-12-01",
      "sortOrder": 14,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.17",
      "description": "50% SOFT COST CONTINGENCY",
      "totalBudget": 53132,
      "scheduleMode": "EVEN",
      "startDate": "2025-11-01",
      "endDate": "2026-09-01",
      "sortOrder": 15,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.18",
      "description": "MARKETING & ADVERTISING",
      "totalBudget": 77750,
      "scheduleMode": "EVEN",
      "startDate": "2025-11-01",
      "endDate": "2026-06-01",
      "sortOrder": 16,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.19",
      "description": "ENTITLEMENTS CONSULTANTS",
      "totalBudget": 87532,
      "scheduleMode": "EVEN",
      "startDate": "2025-02-01",
      "endDate": "2026-06-01",
      "sortOrder": 17,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.20",
      "description": "ENVIRONMENTAL / SITE CONDITIONS",
      "totalBudget": 250000,
      "scheduleMode": "EVEN",
      "startDate": "2026-12-01",
      "endDate": "2027-02-01",
      "sortOrder": 18,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.21",
      "description": "DEVELOPER STARTUP FEE (CONVERTED TO BROWN EQUITY)",
      "totalBudget": 604495,
      "scheduleMode": "EVEN",
      "startDate": "2026-01-01",
      "endDate": "2026-12-01",
      "sortOrder": 19,
      "payments": []
    },
    {
      "category": "PROJECT START-UP",
      "code": "1.12",
      "description": "ALCOHOL LICENCE",
      "totalBudget": 100000,
      "scheduleMode": "CUSTOM",
      "startDate": null,
      "endDate": null,
      "sortOrder": 20,
      "payments": [
        {
          "date": "2027-01-01",
          "amount": 50000
        },
        {
          "date": "2028-01-01",
          "amount": 50000
        }
      ]
    }
  ],
  "draws": [
    {
      "name": "Draw 1",
      "date": "2026-09-01",
      "amount": 600000,
      "source": "Construction Loan",
      "sortOrder": 0
    },
    {
      "name": "Draw 2",
      "date": "2027-03-01",
      "amount": 527318.15,
      "source": "Construction Loan",
      "sortOrder": 1
    }
  ],
  "capTable": [
    {
      "name": "GP",
      "role": "GP",
      "ownershipPercent": 13,
      "contributions": [
        {
          "date": "2025-11-01",
          "amount": 1100000,
          "note": "Initial capital contribution"
        }
      ],
      "distributions": []
    },
    {
      "name": "LP",
      "role": "LP",
      "ownershipPercent": 87,
      "contributions": [
        {
          "date": "2025-11-01",
          "amount": 7577460,
          "note": "Initial capital contribution"
        }
      ],
      "distributions": []
    }
  ]
};
