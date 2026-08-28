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
  { id: "akola", name: "Akola", nameMr: "अकोला", region: "Vidarbha", lat: 20.7, lon: 77.0, bounds: box(20.7, 77.0, 0.32, 0.36) },
  { id: "amravati", name: "Amravati", nameMr: "अमरावती", region: "Vidarbha", lat: 20.93, lon: 77.75, bounds: box(20.93, 77.75, 0.34, 0.4) },
  { id: "yavatmal", name: "Yavatmal", nameMr: "यवतमाळ", region: "Vidarbha", lat: 20.39, lon: 78.13, bounds: box(20.39, 78.13, 0.36, 0.42) },
  { id: "nagpur", name: "Nagpur", nameMr: "नागपूर", region: "Vidarbha", lat: 21.15, lon: 79.09, bounds: box(21.15, 79.09, 0.34, 0.4) },
  { id: "wardha", name: "Wardha", nameMr: "वर्धा", region: "Vidarbha", lat: 20.75, lon: 78.6, bounds: box(20.75, 78.6, 0.28, 0.3) },
  { id: "jalgaon", name: "Jalgaon", nameMr: "जळगाव", region: "Khandesh", lat: 21.0, lon: 75.57, bounds: box(21.0, 75.57, 0.34, 0.42) },
  { id: "nashik", name: "Nashik", nameMr: "नाशिक", region: "Western Maharashtra", lat: 20.0, lon: 73.79, bounds: box(20.0, 73.79, 0.36, 0.42) },
  { id: "pune", name: "Pune", nameMr: "पुणे", region: "Western Maharashtra", lat: 18.52, lon: 73.86, bounds: box(18.52, 73.86, 0.36, 0.44) },
  { id: "solapur", name: "Solapur", nameMr: "सोलापूर", region: "Western Maharashtra", lat: 17.66, lon: 75.9, bounds: box(17.66, 75.9, 0.38, 0.44) },
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
  { id: "u-officer-2", name: "M. Jadhav", role: "officer", districtId: "yavatmal", designation: "Agriculture Assistant, Yavatmal" },
];

/** Village names by district — plausible Vidarbha / Khandesh / Western Maharashtra settlements. */
export const VILLAGES: Record<string, string[]> = {
  akola: ["Borgaon Manju", "Ugwa", "Kanshivani", "Patur", "Alegaon", "Kurankhed"],
  amravati: ["Shirala", "Nandgaon Peth", "Walgaon", "Bhatkuli", "Kholapur", "Asegaon"],
  yavatmal: ["Kalamb", "Wadki", "Ner Parsopant", "Ghatanji", "Sawargaon", "Pimpalgaon"],
  nagpur: ["Kalmeshwar", "Mouda", "Bela", "Adasa", "Khapa", "Dhapewada"],
  wardha: ["Selu", "Deoli", "Rohana", "Pipri", "Talegaon", "Sindi"],
  jalgaon: ["Erandol", "Dharangaon", "Bhusawal Khurd", "Pachora", "Shirsoli", "Nashirabad"],
  nashik: ["Dindori", "Ozar", "Lasalgaon", "Chandwad", "Pimpalgaon Baswant", "Vani"],
  pune: ["Shirur", "Junnar", "Rajgurunagar", "Indapur", "Baramati Khurd", "Nira"],
  solapur: ["Mohol", "Pandharpur Khurd", "Karmala", "Mangalwedha", "Akluj", "Sangola"],
};

export const FARM_PREFIX = ["Shree Ganesh", "Sant Tukaram", "Jai Kisan", "Shivneri", "Vitthal", "Krushi Vikas", "Panduranga", "Gomai", "Jijau", "Sahyadri", "Warkari", "Shree Datta"];
export const FARM_SUFFIX = ["Farm", "Sheti", "Krushi Kendra", "Mala", "Baug"];
export const OWNER_FIRST = ["Ramesh", "Sunita", "Vitthal", "Anil", "Manda", "Sanjay", "Pralhad", "Kavita", "Namdev", "Shobha", "Dnyaneshwar", "Ashwini"];
export const OWNER_LAST = ["Deshmukh", "Pawar", "Wankhede", "Ingle", "Patil", "Gaikwad", "Thorat", "Bhoyar", "Kale", "Shinde", "Rathod", "Sarode"];
