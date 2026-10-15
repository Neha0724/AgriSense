export const MOCK_FIELDS = [
  {
    id: 1,
    name: 'North Field',
    crop: 'Wheat',
    area: 2.5,
    unit: 'hectares',
    soilType: 'Loamy',
    growthStage: 'Vegetative',
    healthStatus: 'Good',
    soilMoisture: 42,
    nitrogen: 48,
    phosphorus: 32,
    potassium: 41,
    temperature: 28,
    humidity: 65,
    rainfall: 12,
    lastAnalyzed: '2026-09-04 09:30 AM',
    coordinates: '28.6139° N, 77.2090° E'
  },
  {
    id: 2,
    name: 'South Field',
    crop: 'Rice',
    area: 3.2,
    unit: 'hectares',
    soilType: 'Clay',
    growthStage: 'Flowering',
    healthStatus: 'Moderate',
    soilMoisture: 58,
    nitrogen: 35,
    phosphorus: 28,
    potassium: 50,
    temperature: 30,
    humidity: 78,
    rainfall: 25,
    lastAnalyzed: '2026-09-03 04:15 PM',
    coordinates: '28.6100° N, 77.2150° E'
  },
  {
    id: 3,
    name: 'East Field',
    crop: 'Cotton',
    area: 1.8,
    unit: 'hectares',
    soilType: 'Sandy Loam',
    growthStage: 'Fruiting',
    healthStatus: 'Good',
    soilMoisture: 38,
    nitrogen: 52,
    phosphorus: 40,
    potassium: 45,
    temperature: 29,
    humidity: 60,
    rainfall: 8,
    lastAnalyzed: '2026-09-04 08:00 AM',
    coordinates: '28.6200° N, 77.2000° E'
  }
];

export const MOCK_WEATHER = {
  current: {
    temp: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    rainfall: 12,
    windSpeed: 14,
    pressure: 1013,
    uvIndex: 6,
    dewPoint: 20
  },
  forecast: [
    { day: 'Today', temp: 28, tempLow: 21, condition: 'Partly Cloudy', rainProb: 20, rainfall: 2, icon: 'cloud-sun' },
    { day: 'Tomorrow', temp: 30, tempLow: 22, condition: 'Sunny', rainProb: 10, rainfall: 0, icon: 'sun' },
    { day: 'Thu', temp: 31, tempLow: 23, condition: 'Clear', rainProb: 5, rainfall: 0, icon: 'sun' },
    { day: 'Fri', temp: 27, tempLow: 20, condition: 'Moderate Rain', rainProb: 75, rainfall: 18, icon: 'cloud-rain' },
    { day: 'Sat', temp: 26, tempLow: 19, condition: 'Heavy Rain', rainProb: 90, rainfall: 32, icon: 'cloud-lightning' }
  ],
  hourly: [
    { time: '06:00', temp: 22, humidity: 80, rainProb: 10 },
    { time: '09:00', temp: 25, humidity: 72, rainProb: 15 },
    { time: '12:00', temp: 28, humidity: 65, rainProb: 20 },
    { time: '15:00', temp: 29, humidity: 60, rainProb: 25 },
    { time: '18:00', temp: 26, humidity: 68, rainProb: 15 },
    { time: '21:00', temp: 24, humidity: 75, rainProb: 10 }
  ]
};

export const MOCK_CHARTS_DATA = {
  moistureTrend: [
    { date: 'Aug 29', moisture: 54, target: 50 },
    { date: 'Aug 30', moisture: 50, target: 50 },
    { date: 'Aug 31', moisture: 47, target: 50 },
    { date: 'Sep 01', moisture: 45, target: 50 },
    { date: 'Sep 02', moisture: 48, target: 50 },
    { date: 'Sep 03', moisture: 44, target: 50 },
    { date: 'Sep 04', moisture: 42, target: 50 }
  ],
  rainfallTrend: [
    { date: 'Aug 29', rain: 0, temp: 29 },
    { date: 'Aug 30', rain: 4, temp: 30 },
    { date: 'Aug 31', rain: 15, temp: 27 },
    { date: 'Sep 01', rain: 2, temp: 28 },
    { date: 'Sep 02', rain: 0, temp: 31 },
    { date: 'Sep 03', rain: 8, temp: 29 },
    { date: 'Sep 04', rain: 12, temp: 28 }
  ],
  irrigationHistory: [
    { date: 'Aug 29', applied: 15, recommended: 15 },
    { date: 'Aug 30', applied: 0, recommended: 0 },
    { date: 'Aug 31', applied: 0, recommended: 0 },
    { date: 'Sep 01', applied: 18, recommended: 20 },
    { date: 'Sep 02', applied: 0, recommended: 0 },
    { date: 'Sep 03', applied: 10, recommended: 12 },
    { date: 'Sep 04', applied: 20, recommended: 20 }
  ],
  nutrientLevels: [
    { name: 'Nitrogen (N)', current: 48, optimalMin: 60, optimalMax: 80, unit: 'mg/kg' },
    { name: 'Phosphorus (P)', current: 32, optimalMin: 30, optimalMax: 50, unit: 'mg/kg' },
    { name: 'Potassium (K)', current: 41, optimalMin: 40, optimalMax: 70, unit: 'mg/kg' }
  ]
};

export const MOCK_RECOMMENDATION_ACTIVE = {
  fieldId: 1,
  fieldName: 'North Field',
  cropType: 'Wheat',
  growthStage: 'Vegetative',
  generatedAt: '2026-09-04 09:30 AM',
  irrigation: {
    status: 'Irrigate Today',
    amount: '18–22 L/m²',
    timing: 'Early morning (06:00 - 08:00 AM)',
    confidence: 91,
    urgency: 'High',
    reasons: [
      'Soil moisture is below optimal range (42% vs 50% target)',
      'Low expected rainfall over the next 24 hours (2 mm)',
      'Crop is currently in vegetative stage requiring peak moisture',
      'Ambient temperature is moderately high (28°C)'
    ]
  },
  fertilizer: {
    nitrogen: 40,
    phosphorus: 20,
    potassium: 25,
    confidence: 87,
    unit: 'kg/ha',
    timing: 'Apply within 48 hours',
    reasons: [
      'Nitrogen level (48 mg/kg) requires supplementation for optimal canopy development',
      'Phosphorus level (32 mg/kg) is adequate for root support',
      'Potassium level (41 mg/kg) is moderate but benefits from minor boost'
    ]
  },
  factorWeights: [
    { factor: 'Soil Moisture', weight: '38%', impact: 'High', status: 'Deficient' },
    { factor: 'Weather Forecast', weight: '27%', impact: 'Moderate', status: 'Low Rain' },
    { factor: 'Crop Growth Stage', weight: '20%', impact: 'High', status: 'Vegetative' },
    { factor: 'Soil Nutrients (N-P-K)', weight: '15%', impact: 'Moderate', status: 'N-Deficient' }
  ]
};

export const MOCK_HISTORY = [
  {
    id: 'REC-2026-0904',
    date: '2026-09-04',
    time: '09:30 AM',
    field: 'North Field',
    crop: 'Wheat',
    soilMoisture: 42,
    irrigation: '18–22 L/m²',
    fertilizer: 'N:40, P:20, K:25 kg/ha',
    confidence: '91%',
    status: 'Irrigate Today',
    statusType: 'alert'
  },
  {
    id: 'REC-2026-0903',
    date: '2026-09-03',
    time: '04:15 PM',
    field: 'South Field',
    crop: 'Rice',
    soilMoisture: 58,
    irrigation: 'No Irrigation Needed',
    fertilizer: 'N:20, P:10, K:15 kg/ha',
    confidence: '94%',
    status: 'Optimal',
    statusType: 'success'
  },
  {
    id: 'REC-2026-0902',
    date: '2026-09-02',
    time: '08:00 AM',
    field: 'East Field',
    crop: 'Cotton',
    soilMoisture: 38,
    irrigation: '22–25 L/m²',
    fertilizer: 'N:35, P:25, K:30 kg/ha',
    confidence: '89%',
    status: 'Irrigate Today',
    statusType: 'alert'
  },
  {
    id: 'REC-2026-0901',
    date: '2026-09-01',
    time: '10:00 AM',
    field: 'North Field',
    crop: 'Wheat',
    soilMoisture: 45,
    irrigation: '12–15 L/m²',
    fertilizer: 'N:15, P:10, K:10 kg/ha',
    confidence: '88%',
    status: 'Scheduled',
    statusType: 'warning'
  },
  {
    id: 'REC-2026-0830',
    date: '2026-08-30',
    time: '09:00 AM',
    field: 'South Field',
    crop: 'Rice',
    soilMoisture: 52,
    irrigation: 'No Irrigation Needed',
    fertilizer: 'N:0, P:0, K:0 kg/ha',
    confidence: '96%',
    status: 'Optimal',
    statusType: 'success'
  }
];

export const MOCK_SETTINGS = {
  profile: {
    name: 'Rajesh Kumar',
    email: 'farmer.rajesh@agrisense.io',
    phone: '+91 98765 43210',
    location: 'Punjab, India',
    farmName: 'Green Valley Eco Farm'
  },
  preferences: {
    irrigationUnit: 'L/m²',
    areaUnit: 'hectares',
    tempUnit: '°C',
    autoRefresh: true,
    alertThreshold: 45
  },
  notifications: {
    emailAlerts: true,
    smsAlerts: true,
    weatherWarnings: true,
    dailySummary: true
  }
};
