import type { Crop, Disease, District, Pest, User } from "@/types";

/** Approximate district centroids and coarse outlines (demonstration cartography). */
function box(lat: number, lon: number, dy: number, dx: number): [number, number][] {
  return [
    [lat + dy, lon - dx],
    [lat + dy * 0.5, lon + dx],
    [lat - dy, lon + dx * 0.7],
    [lat - dy * 0.8, lon - dx * 0.8],
  ];
}

export const DISTRICTS: District[] = [
  // Maharashtra (Vidarbha)
  { id: "akola", name: "Akola", nameMr: "अकोला", region: "Vidarbha", lat: 20.7, lon: 77.0, bounds: box(20.7, 77.0, 0.32, 0.36) },
  { id: "amravati", name: "Amravati", nameMr: "अमरावती", region: "Vidarbha", lat: 20.93, lon: 77.75, bounds: box(20.93, 77.75, 0.34, 0.4) },
  { id: "nagpur", name: "Nagpur", nameMr: "नागपूर", region: "Vidarbha", lat: 21.15, lon: 79.09, bounds: box(21.15, 79.09, 0.34, 0.4) },
  // Punjab
  { id: "ludhiana", name: "Ludhiana", nameMr: "लुधियाना", region: "Punjab", lat: 30.9, lon: 75.86, bounds: box(30.9, 75.86, 0.34, 0.38) },
  { id: "amritsar", name: "Amritsar", nameMr: "अमृतसर", region: "Punjab", lat: 31.63, lon: 74.87, bounds: box(31.63, 74.87, 0.32, 0.36) },
  // Uttar Pradesh
  { id: "lucknow", name: "Lucknow", nameMr: "लखनऊ", region: "Uttar Pradesh", lat: 26.85, lon: 80.95, bounds: box(26.85, 80.95, 0.34, 0.38) },
  { id: "varanasi", name: "Varanasi", nameMr: "वाराणसी", region: "Uttar Pradesh", lat: 25.32, lon: 83.01, bounds: box(25.32, 83.01, 0.30, 0.34) },
  // Madhya Pradesh
  { id: "indore", name: "Indore", nameMr: "इंदौर", region: "Madhya Pradesh", lat: 22.72, lon: 75.86, bounds: box(22.72, 75.86, 0.36, 0.4) },
  { id: "bhopal", name: "Bhopal", nameMr: "भोपाल", region: "Madhya Pradesh", lat: 23.26, lon: 77.41, bounds: box(23.26, 77.41, 0.34, 0.38) },
  // Rajasthan
  { id: "jaipur", name: "Jaipur", nameMr: "जयपूर", region: "Rajasthan", lat: 26.92, lon: 75.79, bounds: box(26.92, 75.79, 0.38, 0.42) },
  { id: "jodhpur", name: "Jodhpur", nameMr: "जोधपूर", region: "Rajasthan", lat: 26.24, lon: 73.02, bounds: box(26.24, 73.02, 0.40, 0.46) },
  // Karnataka
  { id: "belgaum", name: "Belgaum", nameMr: "बेळगाव", region: "Karnataka", lat: 15.85, lon: 74.5, bounds: box(15.85, 74.5, 0.34, 0.38) },
  { id: "mysore", name: "Mysore", nameMr: "म्हैसूर", region: "Karnataka", lat: 12.3, lon: 76.66, bounds: box(12.3, 76.66, 0.32, 0.36) },
  // Tamil Nadu
  { id: "thanjavur", name: "Thanjavur", nameMr: "तंजावूर", region: "Tamil Nadu", lat: 10.79, lon: 79.14, bounds: box(10.79, 79.14, 0.30, 0.34) },
  { id: "coimbatore", name: "Coimbatore", nameMr: "कोईम्बतूर", region: "Tamil Nadu", lat: 11.0, lon: 76.96, bounds: box(11.0, 76.96, 0.32, 0.36) },
  // Andhra Pradesh / Telangana
  { id: "guntur", name: "Guntur", nameMr: "गुंटूर", region: "Andhra Pradesh", lat: 16.31, lon: 80.44, bounds: box(16.31, 80.44, 0.34, 0.38) },
  { id: "warangal", name: "Warangal", nameMr: "वरंगळ", region: "Telangana", lat: 17.97, lon: 79.6, bounds: box(17.97, 79.6, 0.32, 0.36) },
  // West Bengal
  { id: "bardhaman", name: "Bardhaman", nameMr: "बर्धमान", region: "West Bengal", lat: 23.23, lon: 87.86, bounds: box(23.23, 87.86, 0.32, 0.36) },
  { id: "murshidabad", name: "Murshidabad", nameMr: "मुर्शिदाबाद", region: "West Bengal", lat: 24.18, lon: 88.27, bounds: box(24.18, 88.27, 0.30, 0.34) },
  // Gujarat
  { id: "rajkot", name: "Rajkot", nameMr: "राजकोट", region: "Gujarat", lat: 22.3, lon: 70.8, bounds: box(22.3, 70.8, 0.36, 0.4) },
  { id: "ahmedabad", name: "Ahmedabad", nameMr: "अहमदाबाद", region: "Gujarat", lat: 23.02, lon: 72.57, bounds: box(23.02, 72.57, 0.34, 0.38) },
  // Bihar
  { id: "patna", name: "Patna", nameMr: "पाटणा", region: "Bihar", lat: 25.6, lon: 85.1, bounds: box(25.6, 85.1, 0.30, 0.34) },
  // Odisha
  { id: "cuttack", name: "Cuttack", nameMr: "कटक", region: "Odisha", lat: 20.46, lon: 85.88, bounds: box(20.46, 85.88, 0.30, 0.34) },
  // Assam
  { id: "jorhat", name: "Jorhat", nameMr: "जोरहाट", region: "Assam", lat: 26.76, lon: 94.22, bounds: box(26.76, 94.22, 0.28, 0.32) },
  // Kerala
  { id: "palakkad", name: "Palakkad", nameMr: "पालघाट", region: "Kerala", lat: 10.78, lon: 76.65, bounds: box(10.78, 76.65, 0.28, 0.32) },
];

export const DISEASES: Disease[] = [
  {
    id: "bacterial_blight", name: "Bacterial blight", pathogen: "Xanthomonas citri pv. malvacearum", cropIds: ["cotton"],
    favourable: "RH above 80% with intermittent rain and 28-32 °C",
    cultural: ["Remove and destroy infected crop debris", "Avoid overhead irrigation during humid spells", "Use acid-delinted, certified seed next season"],
    biological: ["Seed treatment with Pseudomonas fluorescens", "Foliar spray of Trichoderma-based formulation"],
    chemical: ["Copper-based bactericide is registered for this crop — confirm product and dose with your extension officer before use"],
  },
  {
    id: "yellow_mosaic", name: "Yellow mosaic virus", pathogen: "Mungbean yellow mosaic India virus", cropIds: ["soybean"],
    favourable: "High whitefly population with 26-30 °C and dry spells",
    cultural: ["Rogue out infected plants at first symptom", "Maintain a weed-free bund to remove alternate hosts"],
    biological: ["Install yellow sticky traps at 10 per hectare against the whitefly vector", "Conserve Encarsia parasitoids"],
    chemical: ["Vector management only, on officer advice — no chemical controls the virus itself"],
  },
  { id: "soy_rust", name: "Soybean rust", pathogen: "Phakopsora pachyrhizi", cropIds: ["soybean"], favourable: "Leaf wetness above 8 h with 20-26 °C", cultural: ["Widen row spacing to lower canopy humidity", "Avoid late evening irrigation"], biological: ["Bacillus subtilis foliar application at early pod fill"], chemical: ["Triazole fungicides are used at pod fill — dose and interval must come from your extension officer"] },
  { id: "yellow_rust", name: "Yellow rust", pathogen: "Puccinia striiformis", cropIds: ["wheat"], favourable: "Cool nights below 15 °C with dew", cultural: ["Sow resistant varieties", "Destroy volunteer wheat plants"], biological: ["Bio-fungicide sprays at boot leaf stage"], chemical: ["Consult your extension officer before any fungicide at heading"] },
  { id: "rice_blast", name: "Rice blast", pathogen: "Magnaporthe oryzae", cropIds: ["rice"], favourable: "RH above 90%, night temperature 20-25 °C, heavy nitrogen", cultural: ["Split nitrogen application, avoid excess urea", "Drain the field intermittently"], biological: ["Pseudomonas fluorescens seed and foliar treatment"], chemical: ["Fungicide use at panicle initiation only on officer recommendation"] },
  { id: "sheath_blight", name: "Sheath blight", pathogen: "Rhizoctonia solani", cropIds: ["rice"], favourable: "Dense canopy, RH above 85%", cultural: ["Reduce plant density", "Remove infected stubble"], biological: ["Trichoderma harzianum soil application"], chemical: ["Consult your extension officer if lesions cross the third leaf sheath"] },
  { id: "red_rot", name: "Red rot", pathogen: "Colletotrichum falcatum", cropIds: ["sugarcane"], favourable: "Waterlogging after prolonged rain", cultural: ["Uproot and burn affected clumps", "Improve field drainage"], biological: ["Trichoderma sett treatment before planting"], chemical: ["No effective curative spray — replant with healthy setts on officer advice"] },
  { id: "early_blight", name: "Early blight", pathogen: "Alternaria solani", cropIds: ["tomato"], favourable: "Alternating wet and dry, 24-29 °C", cultural: ["Mulch to stop soil splash", "Stake plants and prune lower leaves"], biological: ["Trichoderma viride foliar spray"], chemical: ["Protectant fungicide schedules must be set by your extension officer"] },
  { id: "late_blight", name: "Late blight", pathogen: "Phytophthora infestans", cropIds: ["tomato"], favourable: "Cool, wet, leaf wetness above 10 h", cultural: ["Destroy infected foliage away from the field", "Avoid evening irrigation"], biological: ["Bacillus subtilis preventive spray"], chemical: ["Systemic fungicide only under officer supervision"] },
  { id: "leaf_curl", name: "Leaf curl virus", pathogen: "Tomato leaf curl virus", cropIds: ["tomato"], favourable: "High whitefly pressure in dry heat", cultural: ["Use nursery netting", "Rogue infected seedlings"], biological: ["Yellow sticky traps and neem-based vector suppression"], chemical: ["Vector control only, on officer advice"] },
  { id: "purple_blotch", name: "Purple blotch", pathogen: "Alternaria porri", cropIds: ["onion"], favourable: "RH above 80% with 25-30 °C", cultural: ["Wider spacing and clean cultivation", "Rotate away from allium crops"], biological: ["Trichoderma soil drench"], chemical: ["Sticker-based protectant sprays on officer advice"] },
  { id: "sigatoka", name: "Sigatoka leaf spot", pathogen: "Mycosphaerella spp.", cropIds: ["banana"], favourable: "Continuous leaf wetness, RH above 85%", cultural: ["De-leaf infected fronds and destroy", "Improve drainage between rows"], biological: ["Bio-fungicide sprays on new leaves"], chemical: ["Oil-based fungicide programmes require officer guidance"] },
];

export const PESTS: Pest[] = [
  { id: "pink_bollworm", name: "Pink bollworm", scientific: "Pectinophora gossypiella", cropIds: ["cotton"], etl: "8 moths per pheromone trap per night for 3 consecutive nights", cultural: ["Destroy rosette flowers and shed bolls", "Avoid extending the cotton season past the recommended date"], biological: ["Release Trichogramma bactrae at 1.5 lakh per hectare", "Install pheromone traps at 5 per hectare for mass trapping"], chemical: ["Rotate approved insecticide groups only after the threshold is crossed — confirm the product with your extension officer"] },
  { id: "american_bollworm", name: "American bollworm", scientific: "Helicoverpa armigera", cropIds: ["cotton", "tomato"], etl: "1 larva per plant or 8 moths per trap per night", cultural: ["Deep summer ploughing", "Install bird perches at 10 per hectare"], biological: ["HaNPV application at 250 LE per hectare", "Release Chrysoperla predators"], chemical: ["Need-based spray after scouting confirms threshold — officer advice required"] },
  { id: "whitefly", name: "Whitefly", scientific: "Bemisia tabaci", cropIds: ["cotton", "soybean", "tomato"], etl: "6 adults per leaf on the top three leaves", cultural: ["Avoid excess nitrogen", "Remove alternate weed hosts"], biological: ["Yellow sticky traps at 12 per hectare", "Verticillium lecanii spray"], chemical: ["Only if trap counts stay above threshold — consult your extension officer"] },
  { id: "girdle_beetle", name: "Girdle beetle", scientific: "Obereopsis brevis", cropIds: ["soybean"], etl: "10% girdled plants", cultural: ["Clip and destroy girdled shoots", "Avoid dense sowing"], biological: ["Conserve natural parasitoids by avoiding blanket sprays"], chemical: ["Spot application on officer advice at first girdling"] },
  { id: "aphids", name: "Aphids", scientific: "Rhopalosiphum spp.", cropIds: ["wheat"], etl: "10 aphids per tiller", cultural: ["Avoid late sowing", "Balanced nitrogen"], biological: ["Conserve coccinellid predators", "Neem oil spray"], chemical: ["Officer-directed spray only in severe infestation"] },
  { id: "bph", name: "Brown planthopper", scientific: "Nilaparvata lugens", cropIds: ["rice"], etl: "10 hoppers per hill", cultural: ["Alternate wetting and drying", "Maintain 30 cm alleys every 3 m"], biological: ["Conserve mirid bugs and spiders"], chemical: ["Basal-directed application after threshold, on officer advice"] },
  { id: "shoot_borer", name: "Early shoot borer", scientific: "Chilo infuscatellus", cropIds: ["sugarcane"], etl: "15% dead hearts", cultural: ["Earthing up and trash mulching", "Remove dead hearts weekly"], biological: ["Release Trichogramma chilonis at 50,000 per hectare"], chemical: ["Granular application only where dead hearts exceed threshold — officer advice"] },
  { id: "fruit_borer", name: "Fruit borer", scientific: "Helicoverpa armigera", cropIds: ["tomato"], etl: "5% fruit damage", cultural: ["Handpick and destroy bored fruits", "Marigold trap rows"], biological: ["HaNPV and Bacillus thuringiensis sprays"], chemical: ["Rotate approved groups on officer advice"] },
  { id: "thrips", name: "Thrips", scientific: "Thrips tabaci", cropIds: ["onion"], etl: "30 thrips per plant", cultural: ["Irrigate to break dry spells", "Intercrop with maize barrier rows"], biological: ["Blue sticky traps, Metarhizium spray"], chemical: ["Officer-directed rotation if counts persist"] },
  { id: "pseudostem_weevil", name: "Pseudostem weevil", scientific: "Odoiporus longicollis", cropIds: ["banana"], etl: "Any fresh oozing tunnel", cultural: ["Remove and burn affected pseudostems", "Avoid injury during de-suckering"], biological: ["Beauveria bassiana swabbing"], chemical: ["Only under officer supervision"] },
];

export const CROPS: Crop[] = [
  { id: "cotton", name: "Cotton", nameMr: "कापूस", season: "kharif", currentStage: "boll_formation", diseaseIds: ["bacterial_blight"], pestIds: ["pink_bollworm", "american_bollworm", "whitefly"] },
  { id: "soybean", name: "Soybean", nameMr: "सोयाबीन", season: "kharif", currentStage: "pod_fill", diseaseIds: ["yellow_mosaic", "soy_rust"], pestIds: ["girdle_beetle", "whitefly"] },
  { id: "rice", name: "Rice", nameMr: "भात", season: "kharif", currentStage: "tillering", diseaseIds: ["rice_blast", "sheath_blight"], pestIds: ["bph"] },
  { id: "sugarcane", name: "Sugarcane", nameMr: "ऊस", season: "perennial", currentStage: "grand_growth", diseaseIds: ["red_rot"], pestIds: ["shoot_borer"] },
  { id: "tomato", name: "Tomato", nameMr: "टोमॅटो", season: "kharif", currentStage: "fruiting", diseaseIds: ["early_blight", "late_blight", "leaf_curl"], pestIds: ["fruit_borer", "american_bollworm", "whitefly"] },
  { id: "onion", name: "Onion", nameMr: "कांदा", season: "kharif", currentStage: "bulbing", diseaseIds: ["purple_blotch"], pestIds: ["thrips"] },
  { id: "wheat", name: "Wheat", nameMr: "गहू", season: "rabi", currentStage: "sowing", diseaseIds: ["yellow_rust"], pestIds: ["aphids"] },
  { id: "banana", name: "Banana", nameMr: "केळी", season: "perennial", currentStage: "fruiting", diseaseIds: ["sigatoka"], pestIds: ["pseudostem_weevil"] },
];

export const USERS: User[] = [
  { id: "u-officer-1", name: "A. Deshmukh", role: "officer", districtId: "amravati", designation: "Plant Protection Officer, Amravati" },
  { id: "u-expert-1", name: "Dr. S. Kulkarni", role: "expert", designation: "Plant Pathologist, Dr. PDKV Akola" },
  { id: "u-expert-2", name: "Dr. R. Pawar", role: "expert", designation: "Entomologist, VNMKV Parbhani" },
  { id: "u-officer-2", name: "M. Jadhav", role: "officer", districtId: "ludhiana", designation: "Agriculture Assistant, Ludhiana" },
];

/** Village names by district — plausible settlements from across India. */
export const VILLAGES: Record<string, string[]> = {
  akola: ["Borgaon Manju", "Ugwa", "Kanshivani", "Patur", "Alegaon", "Kurankhed"],
  amravati: ["Shirala", "Nandgaon Peth", "Walgaon", "Bhatkuli", "Kholapur", "Asegaon"],
  nagpur: ["Kalmeshwar", "Mouda", "Bela", "Adasa", "Khapa", "Dhapewada"],
  ludhiana: ["Jagraon", "Khanna", "Samrala", "Raikot", "Machhiwara", "Payal"],
  amritsar: ["Jandiala Guru", "Ramdas", "Ajnala", "Lopoke", "Baba Bakala", "Majitha"],
  lucknow: ["Mohanlalganj", "Bakshi Ka Talab", "Malihabad", "Kakori", "Itaunja", "Gosainganj"],
  varanasi: ["Sarnath", "Chaubeypur", "Harahua", "Pindra", "Kashi Vidyapith", "Cholapur"],
  indore: ["Mhow", "Sanwer", "Depalpur", "Hatod", "Manpur", "Betma"],
  bhopal: ["Berasia", "Sehore", "Raisen", "Obedullaganj", "Mandideep", "Ashta"],
  jaipur: ["Chomu", "Amber", "Chaksu", "Phulera", "Bassi", "Sanganer"],
  jodhpur: ["Osian", "Phalodi", "Pipar City", "Bilara", "Shergarh", "Luni"],
  belgaum: ["Athni", "Gokak", "Chikkodi", "Raibag", "Bailhongal", "Hukkeri"],
  mysore: ["Nanjangud", "T. Narsipur", "Hunsur", "K.R. Nagar", "Periyapatna", "Heggadadevanakote"],
  thanjavur: ["Kumbakonam", "Papanasam", "Orathanadu", "Pattukkottai", "Peravurani", "Thiruvaiyaru"],
  coimbatore: ["Pollachi", "Mettupalayam", "Sulur", "Annur", "Kinathukadavu", "Valparai"],
  guntur: ["Tenali", "Bapatla", "Narasaraopet", "Sattenapalle", "Macherla", "Vinukonda"],
  warangal: ["Hanamkonda", "Kazipet", "Jangaon", "Parkal", "Mahabubabad", "Narsampet"],
  bardhaman: ["Durgapur", "Asansol", "Memari", "Kalna", "Katwa", "Galsi"],
  murshidabad: ["Berhampur", "Lalbag", "Kandi", "Domkal", "Jangipur", "Raghunathganj"],
  rajkot: ["Morbi", "Gondal", "Jetpur", "Dhoraji", "Upleta", "Jasdan"],
  ahmedabad: ["Dholka", "Sanand", "Bavla", "Dhandhuka", "Viramgam", "Mandal"],
  patna: ["Danapur", "Phulwari", "Masaurhi", "Mokama", "Barh", "Bihta"],
  cuttack: ["Choudwar", "Athgarh", "Banki", "Salepur", "Niali", "Narsinghpur"],
  jorhat: ["Mariani", "Titabar", "Teok", "Selenghat", "Pulibor", "Cinnamara"],
  palakkad: ["Ottapalam", "Mannarkkad", "Chittur", "Alathur", "Shornur", "Pattambi"],
};
export const FARM_PREFIX = ["Shree Ganesh", "Sant Tukaram", "Jai Kisan", "Shivneri", "Vitthal", "Krushi Vikas", "Panduranga", "Gomai", "Jijau", "Sahyadri", "Warkari", "Shree Datta", "Annapurna", "Bharat Krishi", "Swami Vivekananda", "Green Valley"];
export const FARM_SUFFIX = ["Farm", "Sheti", "Krushi Kendra", "Mala", "Baug", "Fields", "Agri"];
export const OWNER_FIRST = ["Ramesh", "Sunita", "Vitthal", "Anil", "Manda", "Sanjay", "Pralhad", "Kavita", "Namdev", "Shobha", "Dnyaneshwar", "Ashwini", "Harpreet", "Rajesh", "Gita", "Suresh", "Lakshmi", "Mohan", "Priya", "Vikram"];
export const OWNER_LAST = ["Deshmukh", "Pawar", "Wankhede", "Ingle", "Patil", "Gaikwad", "Thorat", "Bhoyar", "Kale", "Shinde", "Rathod", "Sarode", "Singh", "Sharma", "Reddy", "Nair", "Das", "Rao", "Patel", "Kumar"];
