export interface AgriRecord {
  id: string;
  state: string;
  crop: string;
  season: string;
  year: number;
  area: number; // hectares
  production: number; // tonnes
  yield: number; // kg per hectare
  rainfall: number; // mm
  irrigation: number; // % of area covered
  fertilizer: number; // kg per hectare
  productivity: 'High' | 'Medium' | 'Low';
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const CROPS = [
  'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 'Jowar', 'Bajra', 
  'Ragi', 'Barley', 'Gram', 'Tur', 'Groundnut', 'Sunflower', 'Soyabean', 
  'Mustard', 'Jute', 'Tea', 'Coffee', 'Rubber', 'Coconut', 'Tobacco'
];

export const SEASONS = ['Kharif', 'Rabi', 'Summer', 'Whole Year'];

const generateMockData = (): AgriRecord[] => {
  const data: AgriRecord[] = [];
  let idCounter = 1;

  // To keep the dataset manageable but comprehensive, we'll sample years and crop-state combinations
  for (const state of INDIAN_STATES) {
    // Each state has a subset of crops it's known for
    const stateCrops = CROPS.filter(() => Math.random() > 0.6);
    if (stateCrops.length === 0) stateCrops.push(CROPS[Math.floor(Math.random() * CROPS.length)]);

    for (const crop of stateCrops) {
      const season = SEASONS[Math.floor(Math.random() * SEASONS.length)];
      
      for (let year = 2018; year <= 2024; year++) {
        const baseYield = crop === 'Sugarcane' ? 70000 : 
                         crop === 'Rice' ? 2500 : 
                         crop === 'Wheat' ? 3200 : 
                         crop === 'Cotton' ? 500 : 1500;
        
        const stateMultiplier = (state === 'Punjab' || state === 'Haryana') ? 1.5 : 
                               (state === 'Tamil Nadu' || state === 'Andhra Pradesh') ? 1.2 : 0.9;
        
        const randomFactor = 0.7 + Math.random() * 0.6;
        const yieldVal = Math.round(baseYield * stateMultiplier * randomFactor);
        
        const area = Math.round(1000 + Math.random() * 50000);
        const production = Math.round((area * yieldVal) / 1000); // Production in tonnes
        
        const rainfall = Math.round(400 + Math.random() * 2000);
        const irrigation = (state === 'Punjab') ? 98 : Math.round(20 + Math.random() * 70);
        const fertilizer = Math.round(80 + Math.random() * 250);

        let productivity: 'High' | 'Medium' | 'Low' = 'Medium';
        if (yieldVal > baseYield * 1.3) productivity = 'High';
        else if (yieldVal < baseYield * 0.7) productivity = 'Low';

        data.push({
          id: `rec-${idCounter++}`,
          state,
          crop,
          season,
          year,
          area,
          production,
          yield: yieldVal,
          rainfall,
          irrigation,
          fertilizer,
          productivity
        });
      }
    }
  }
  return data;
};

export const MOCK_AGRI_DATA = generateMockData();
