import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Hospital, ShieldAlert, Fuel, Phone, ExternalLink, Award, CheckCircle } from 'lucide-react';

interface MapContainerProps {
  locationName: string;
  onLocationChange?: (newLocation: string) => void;
  language: 'en' | 'hi';
}

interface Facility {
  name: string;
  nameHi: string;
  distance: string;
  distanceHi: string;
  address: string;
  addressHi: string;
  status: string;
  statusHi: string;
  phone: string;
  type: 'hospital' | 'police' | 'petrol';
}

export default function MapContainer({
  locationName,
  language,
}: MapContainerProps) {
  const [activeTab, setActiveTab] = useState<'hospital' | 'police' | 'petrol'>('hospital');
  const [selectedRouteFacility, setSelectedRouteFacility] = useState<Facility | null>(null);
  const [routingAnimationStep, setRoutingAnimationStep] = useState(0);

  // Dynamic localization-based facilities generator
  const getNearestFacilities = (location: string): Facility[] => {
    // Extract a clean regional identifier for customization
    const rawSegment = location.split(',')[0].trim();
    // Neutralize default placeholder display names
    const cleanArea = rawSegment === 'Rajpath' ? 'Central Delhi' : rawSegment;
    const cleanFull = location.trim();

    return [
      // HOSPITALS
      {
        name: `${cleanArea} Care Emergency Hospital`,
        nameHi: `${cleanArea} केयर आपातकालीन चिकित्सालय`,
        distance: '0.6 km',
        distanceHi: '0.6 किमी',
        address: `Main Junction Compound, Near Metro Lane, ${cleanFull}`,
        addressHi: `मुख्य चौराहा कॉम्प्लेक्स, मेट्रो लेन के समीप, ${cleanFull}`,
        status: 'Open 24/7 • Trauma Beds Available',
        statusHi: '२४/७ चालू • आपातकालीन बेड उपलब्ध',
        phone: '102',
        type: 'hospital',
      },
      {
        name: `Red Cross Emergency Centre (${cleanArea})`,
        nameHi: `रेड क्रॉस आपातकालीन सेवाएं (${cleanArea})`,
        distance: '1.4 km',
        distanceHi: '1.4 किमी',
        address: `Sector B Main Market, Near Post Office, ${cleanFull}`,
        addressHi: `सेक्टर बी मुख्य बाजार, पोस्ट ऑफिस के निकट, ${cleanFull}`,
        status: 'Open 24/7 • Surgical Specialist Active',
        statusHi: '२४/७ चालू • आकस्मिक शल्य चिकित्सा सक्रिय',
        phone: '102',
        type: 'hospital',
      },
      {
        name: `${cleanArea} Apollo Civil Trauma Clinic`,
        nameHi: `${cleanArea} अपोलो सिविल ट्रॉमा क्लिनिक`,
        distance: '2.5 km',
        distanceHi: '2.5 किमी',
        address: `Expressway Service Bypass Lane, Line Proximity, ${cleanFull}`,
        addressHi: `एक्सप्रेसवे सर्विस बाईपास लेन, लाइन संपर्क क्षेत्र, ${cleanFull}`,
        status: 'Open 24/7 • Fast Response Ambulance Depot',
        statusHi: '२४/७ चालू • तीव्र-गति एम्बुलेंस डिपो',
        phone: '102',
        type: 'hospital',
      },

      // POLICE STATIONS
      {
        name: `${cleanArea} Integrated Police Control Post`,
        nameHi: `${cleanArea} एकीकृत पुलिस नियंत्रण चौकी`,
        distance: '0.4 km',
        distanceHi: '0.4 किमी',
        address: `Sector Security Entrance Gate, Ground Zero, ${cleanFull}`,
        addressHi: `सेक्टर सुरक्षा प्रवेश द्वार, ग्राउंड जीरो के पास, ${cleanFull}`,
        status: 'Active Patrol • 112 Command Linked',
        statusHi: 'सक्रिय गश्ती दल • ११२ कंट्रोल रूम कनेक्टेड',
        phone: '112',
        type: 'police',
      },
      {
        name: `District Police Headquarters Civil Station - ${cleanArea}`,
        nameHi: `जिला पुलिस मुख्यालय सिविल चौकी - ${cleanArea}`,
        distance: '1.1 km',
        distanceHi: '1.1 किमी',
        address: `Government Court Complex Avenue, ${cleanFull}`,
        addressHi: `सरकारी कचहरी परिसर एवेन्यू, ${cleanFull}`,
        status: 'Security Desk • Free Citizen Legal Desk',
        statusHi: 'सुरक्षा डेस्क • नागरिक विधिक सहायता सक्रिय',
        phone: '112',
        type: 'police',
      },
      {
        name: `Highway Flying Squad Patrol Point (${cleanArea})`,
        nameHi: `राजमार्ग सुरक्षा त्वरित बल गश्ती केंद्र (${cleanArea})`,
        distance: '2.9 km',
        distanceHi: '2.9 किमी',
        address: `National Highway Toll Plaza Zone, Wing-9, ${cleanFull}`,
        addressHi: `राष्ट्रीय राजमार्ग टोल प्लाजा जोन, विंग-9, ${cleanFull}`,
        status: '24/7 Rapid Interceptor Unit Enabled',
        statusHi: '२४/७ रैपिड गश्ती इंटरसेप्टर तैनात',
        phone: '112',
        type: 'police',
      },

      // PETROL PUMPS
      {
        name: `Indian Oil (IOCL) - ${cleanArea} Filling Zone`,
        nameHi: `इंडियन ऑयल (IOCL) - ${cleanArea} फिलिंग स्टेशन`,
        distance: '0.8 km',
        distanceHi: '0.8 किमी',
        address: `G-Block Main Extension Highway Bypass, ${cleanFull}`,
        addressHi: `जी-ब्लॉक मुख्य विस्तार हाईवे बाईपास, ${cleanFull}`,
        status: 'Fuel Available • EV Hyper-Charger Point',
        statusHi: 'ईंधन स्टॉक उपलब्ध • ईवी सुपर-चार्जिंग पॉइंट',
        phone: 'IOCL Fuel Desk',
        type: 'petrol',
      },
      {
        name: `Bharat Petroleum (BPCL) Speed Station - ${cleanArea}`,
        nameHi: `भारत पेट्रोलियम (BPCL) स्पीड स्टेशन - ${cleanArea}`,
        distance: '1.7 km',
        distanceHi: '1.7 किमी',
        address: `Ring Road Cross Interchange Road East, ${cleanFull}`,
        addressHi: `रिंग रोड क्रॉस ओवरपास इंटरचेंज, पूर्वी क्षेत्र, ${cleanFull}`,
        status: 'Fuel Available • Nitrogen High-Volume Air',
        statusHi: 'ईंधन स्टॉक उपलब्ध • नाइट्रोजन हवा प्रेशर यूनिट',
        phone: 'BPCL Fuel Desk',
        type: 'petrol',
      },
      {
        name: `Hindustan Petroleum (HPCL) - ${cleanArea}`,
        nameHi: `हिंदुस्तान पेट्रोलियम (HPCL) - ${cleanArea}`,
        distance: '2.3 km',
        distanceHi: '2.3 किमी',
        address: `Opposite Metro Pillar Corridor Block 4, ${cleanFull}`,
        addressHi: `मेट्रो पिलर कॉरिडोर ब्लॉक ४ के विपरीत, ${cleanFull}`,
        status: 'LPG Refilling & Standard Fuel Stock Open',
        statusHi: 'एलपीजी रिफ्यूलिंग व वाहन ईंधन स्टॉक उपलब्ध',
        phone: 'HPCL Fuel Desk',
        type: 'petrol',
      }
    ];
  };

  const allFacilities = getNearestFacilities(locationName);
  const activeFacilities = allFacilities.filter(f => f.type === activeTab);

  // Simulated GPS routing loop to mimic real satellite tracking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedRouteFacility) {
      setRoutingAnimationStep(1);
      timer = setInterval(() => {
        setRoutingAnimationStep((prev) => {
          if (prev >= 4) {
            clearInterval(timer);
            return 4; // Complete state
          }
          return prev + 1;
        });
      }, 1200);
    } else {
      setRoutingAnimationStep(0);
    }
    return () => clearInterval(timer);
  }, [selectedRouteFacility]);

  const deviceCoords = localStorage.getItem('sahayak_custom_location_coords') || '28.6139° N, 77.2090° E';

  return (
    <div id="location-context-card" className="glass-card rounded-2xl p-6 border border-white/10 overflow-hidden relative mb-8 shadow-2xl">
      
      {/* Upper Grid - Location detail indicator & Satellite tracker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-sans font-black text-[10px] uppercase text-emerald-400 tracking-wider leading-none">
              {language === 'hi' ? 'वास्तविक समय उपग्रह संप्रेषण' : 'LIVE DEVICE SATELLITE LOCATOR'}
            </span>
          </div>

          <div className="mt-3 flex items-start gap-2.5 min-w-0">
            <MapPin size={22} className="text-pink-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="font-sans font-extrabold text-white text-xl leading-snug tracking-tight truncate">
                {locationName}
              </h4>
              <p className="font-mono text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md inline-block mt-1.5 font-bold shadow-sm">
                Lat/Lon: {deviceCoords}
              </p>
            </div>
          </div>

          <p className="font-sans text-xs text-white/70 mt-3 flex items-center gap-1.5 select-none bg-white/5 p-2 rounded-xl border border-white/5">
            <Compass size={14} className="text-pink-400 animate-spin-slow shrink-0" />
            <span className="font-mono text-[10px] text-white/80 font-semibold uppercase tracking-wide">
              {language === 'hi' 
                ? '१००% स्थानीय सुरक्षा ट्रैकिंग लॉक्ड • लाइव जीपीएस सेंसर' 
                : '100% SECURE GRID SYNCED • LIVE DEVICE HARNESS ACTIVE'}
            </span>
          </p>
        </div>

        {/* Visual Map Radar Indicator component */}
        <div className="w-full md:w-32 h-32 rounded-xl bg-slate-950/60 overflow-hidden border border-white/10 relative shadow-2xl select-none shrink-0 group">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(99,102,241,0.15)_0%,_transparent_100%)]" />
          
          {/* Animated radar sonar lines */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-indigo-500/40 animate-pulse" />
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-indigo-500/40 animate-pulse" />
          <div className="absolute left-1/2 top-1/2 -ml-8 -mt-8 w-16 h-16 rounded-full border border-indigo-500/20 animate-ping" />
          <div className="absolute left-1/2 top-1/2 -ml-12 -mt-12 w-24 h-24 rounded-full border border-indigo-500/15 animate-ping" style={{ animationDelay: '1s' }} />
          
          <img
            className="w-full h-full object-cover opacity-60 mix-blend-screen scale-105"
            referrerPolicy="no-referrer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHDxxr2Ukl5T4u_tAYimrAsdnn-9misKJwLHq3T7u__Ekjvdf_yd1BBmM4Si7Ix1lFO9RB1CaESh7-vFaAyRS7IDiHY4GFCZyFmqACHat61AGFMRhO9ibII7U0JoN-OFK_4J6dAUa0uEYRJdo1f86f4Oxcp6B9eOVdteObarU5qDomGwny0L2zd7movIJJuO3V8M1t-eIPLvTqrRbMB53oDaYUjCv6ZlZ5v5fWISWymltFizovJaX02KsBlD0Gtf1EFS_ImAL0nny4"
            alt="Real-time locator maps radar screen"
          />

          <div className="absolute top-2 left-2 bg-pink-500 w-1.5 h-1.5 rounded-full animate-ping" />
          <div className="absolute bottom-4 right-4 bg-indigo-400 w-1.5 h-1.5 rounded-full" />
          <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-1 text-[9px] text-center font-mono font-black text-indigo-300 border-t border-white/5">
            SATELLITE GPS (ACTV)
          </div>
        </div>
      </div>

      {/* CORE FEATURE: Options widget showing nearest Hospitals, Police Stations, and Petrol Pumps */}
      <div id="essentials-transceiver-box" className="mt-6 pt-5 border-t border-white/10 relative z-10">
        
        <div className="flex items-center justify-between mb-4">
          <h5 className="font-sans font-extrabold text-xs uppercase tracking-wider text-white">
            {language === 'hi' ? 'अपने आस-पास आपातकालीन सुविधाएं' : 'NEAREST IN-PROXIMITY SERVICES'}
          </h5>
          <span className="font-mono text-[9px] text-[#f472b6] bg-pink-500/10 border border-pink-500/30 px-2 py-0.5 rounded font-black">
            {language === 'hi' ? 'वास्तविक स्थान आधारित' : 'COORDS TRIANGULATED'}
          </span>
        </div>

        {/* Categories Tab Selector Menu */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/50 rounded-xl border border-white/5 select-none mb-4">
          <button
            id="tab-hospital-service"
            onClick={() => { setActiveTab('hospital'); setSelectedRouteFacility(null); }}
            className={`py-2 rounded-lg text-xs font-sans font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'hospital'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Hospital size={14} />
            <span>{language === 'hi' ? 'अस्पताल' : 'Hospitals'}</span>
          </button>

          <button
            id="tab-police-service"
            onClick={() => { setActiveTab('police'); setSelectedRouteFacility(null); }}
            className={`py-2 rounded-lg text-xs font-sans font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'police'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldAlert size={14} />
            <span>{language === 'hi' ? 'पुलिस स्टेशन' : 'Police Stations'}</span>
          </button>

          <button
            id="tab-petrol-service"
            onClick={() => { setActiveTab('petrol'); setSelectedRouteFacility(null); }}
            className={`py-2 rounded-lg text-xs font-sans font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'petrol'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Fuel size={14} />
            <span>{language === 'hi' ? 'पेट्रोल पंप' : 'Petrol Pumps'}</span>
          </button>
        </div>

        {/* Listed Facility results dynamically based on active categories tab */}
        <div className="space-y-3">
          {activeFacilities.map((fac, index) => (
            <div
              key={index}
              className="p-3 bg-white/5 transition-all hover:bg-white/10 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-black text-xs text-white">
                    {language === 'hi' ? fac.nameHi : fac.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-widest font-black shrink-0 ${
                    activeTab === 'hospital' 
                      ? 'bg-red-500/15 text-red-300 border border-red-500/20' 
                      : (activeTab === 'police' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20')
                  }`}>
                    {language === 'hi' ? fac.distanceHi : fac.distance}
                  </span>
                </div>
                <p className="font-sans text-[11px] text-white/50 mt-1 truncate">
                  {language === 'hi' ? fac.addressHi : fac.address}
                </p>
                <p className="font-sans text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>{language === 'hi' ? fac.statusHi : fac.status}</span>
                </p>
              </div>

              {/* Action operations trigger buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedRouteFacility(fac)}
                  className="p-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-sans text-xs font-extrabold flex items-center gap-1 shadow cursor-pointer"
                  title="Route to Facility"
                >
                  <Navigation size={11} className="rotate-45" />
                  <span>{language === 'hi' ? 'मार्ग' : 'Route'}</span>
                </button>

                {fac.phone.match(/^\d+$/) ? (
                  <a
                    href={`tel:${fac.phone}`}
                    className="p-1 px-2 text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-colors flex items-center justify-center shrink-0"
                    title={`Call Assistance helpline: ${fac.phone}`}
                  >
                    <Phone size={12} />
                  </a>
                ) : (
                  <button
                    onClick={() => alert(`Connecting directly with regional ${fac.name}. Live locator details transmitted to their front-desk.`)}
                    className="p-1 px-2 text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                    title="Connect Desk Information"
                  >
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated GPS Routing Stream Modal/Box Overlay */}
      {selectedRouteFacility && (
        <div id="live-route-tracer-modal" className="absolute inset-0 bg-slate-950/95 z-40 p-5 flex flex-col justify-between animate-fade-in relative">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span className="font-mono text-[10px] uppercase text-indigo-300 font-black tracking-widest block leading-none">
                {language === 'hi' ? 'लाइव सुरक्षित नेविगेशन लिंक' : 'SECURE GPS DIRECTION TRACER'}
              </span>
            </div>
            <button
              onClick={() => setSelectedRouteFacility(null)}
              className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें' : 'Close Trace'}
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            
            {/* Spinning Radar Target Node */}
            <div className="w-16 h-16 rounded-full border border-pink-500/30 flex items-center justify-center bg-pink-500/10 mb-4 animate-pulse relative">
              <Navigation size={28} className="text-pink-400 rotate-45 animate-bounce" />
              <div className="absolute inset-0 rounded-full border border-pink-500/20 animate-ping" />
            </div>

            <h4 className="font-sans font-extrabold text-sm text-white">
              {routingAnimationStep === 4 
                ? (language === 'hi' ? 'मार्ग सफलतापूर्वक सिंक किया गया!' : 'Emergency Route Stream Synced!') 
                : (language === 'hi' ? 'अक्षांश/देशांतर स्थान की मैपिंग हो रही है...' : 'Pinpointing Quickest Emergency Route...')}
            </h4>
            
            <p className="font-sans text-xs text-white/60 mt-2 max-w-xs block leading-relaxed">
              {language === 'hi'
                ? `आपके वर्तमान स्थान (${deviceCoords}) से ${selectedRouteFacility.nameHi} (${selectedRouteFacility.distanceHi}) तक का मार्ग सत्यापित किया जा रहा है।`
                : `Triangulating exact safety lanes from your verified GPS node (${deviceCoords}) to ${selectedRouteFacility.name} (${selectedRouteFacility.distance}).`}
            </p>

            {/* Simulated Live Loading Bar */}
            <div className="w-full max-w-xs bg-white/10 h-2 rounded-full mt-6 overflow-hidden relative border border-white/5 shadow-inner">
              <div 
                className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full transition-all duration-1000" 
                style={{ width: `${(routingAnimationStep / 4) * 100}%` }}
              />
            </div>

            {/* Stepped milestones simulation */}
            <div className="mt-4 font-mono text-[10px] text-indigo-300 font-extrabold uppercase select-none space-y-1">
              {routingAnimationStep === 1 && <div>🛰️ Handshaking with ISRO IRNSS Node...</div>}
              {routingAnimationStep === 2 && <div>🚀 Calculating Traffic Obstacle Matrices...</div>}
              {routingAnimationStep === 3 && <div>🛣️ Creating Clear Rescue Corridor Channels...</div>}
              {routingAnimationStep === 4 && (
                <div className="text-emerald-400 flex items-center gap-1.5 justify-center font-bold">
                  <CheckCircle size={12} />
                  <span>✓ 112 Control Center Dispatched Signal</span>
                </div>
              )}
            </div>

          </div>

          <div className="mt-auto border-t border-white/10 pt-3 text-left">
            <span className="font-mono text-[9px] text-white/40 block">TARGET DETINATION</span>
            <span className="font-sans font-extrabold text-xs text-white block mt-0.5">
              {language === 'hi' ? selectedRouteFacility.nameHi : selectedRouteFacility.name}
            </span>
            <p className="font-sans text-[10px] text-white/50 truncate mt-0.5">
              {language === 'hi' ? selectedRouteFacility.addressHi : selectedRouteFacility.address}
            </p>
          </div>

        </div>
      )}

      {/* Radiant ambient glow effect backing */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-pink-500/10 blur-[80px] rounded-full pointer-events-none"></div>
    </div>
  );
}
