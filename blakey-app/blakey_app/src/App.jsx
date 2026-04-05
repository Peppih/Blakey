import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, loadChecked, saveChecked } from "./supabase";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#F5F0E8;font-family:'DM Sans',sans-serif;font-size:14px}
.task-row{transition:background 0.12s ease,box-shadow 0.12s ease;cursor:pointer}
.task-row:hover{background:#EEE8DA !important}
.chk{transition:all 0.18s cubic-bezier(.4,0,.2,1);flex-shrink:0}
.chk:hover{transform:scale(1.12)}
.phase-hdr{cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:background 0.12s}
.phase-hdr:hover{background:#FAFAF5}
.arrow{transition:transform 0.22s cubic-bezier(.4,0,.2,1)}
.arrow.open{transform:rotate(90deg)}
.link-pill{transition:all 0.14s;text-decoration:none;display:inline-flex;align-items:center;gap:4px}
.link-pill:hover{filter:brightness(1.12);transform:translateY(-1px)}
.filter-chip{cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all 0.15s}
.filter-chip:hover{opacity:0.9}
.progress-arc{transition:stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)}
.progress-bar-fill{transition:width 0.5s cubic-bezier(.4,0,.2,1)}
.phase-fill{transition:width 0.35s}
.phase-card{border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(13,59,46,0.07);border:1px solid #E3DDD3;background:#FFF;margin-bottom:14px}
.done-text{text-decoration:line-through;text-decoration-color:#B5B0A8;color:#B5B0A8 !important}
.done-row{background:#F6FBF7 !important}
`;

const FOREST = "#0D3B2E";
const FOREST2 = "#1A5C40";
const GOLD   = "#C9963E";
const GOLD2  = "#E8B84B";
const CREAM  = "#F5F0E8";
const WHITE  = "#FFFFFF";

const WHO = {
  wife:    { bg:"#EDE7F6", fg:"#5B3593", label:"Wife"    },
  husband: { bg:"#E3F0FD", fg:"#1455A4", label:"Husband" },
  son:     { bg:"#FDE8E3", fg:"#B83B1E", label:"Son"     },
  family:  { bg:"#E6F4EA", fg:"#256430", label:"Family"  },
};

const PHASES = [
  {
    id:"ph1", badge:"Phase 1", title:"Pre-Departure", sub:"12–18 Months Before Move", icon:"✈️",
    tasks:[
      {id:"t001",who:"wife",   text:"Download and complete Form 32 — Dual Citizenship Declaration",                                       link:{label:"eCitizen Portal",            url:"https://www.ecitizen.go.ke"}},
      {id:"t002",who:"wife",   text:"Gather required docs: Kenyan birth certificate, old Kenyan ID/passport, US passport, US police clearance"},
      {id:"t003",who:"wife",   text:"Submit Form 32 via eCitizen portal or in person at Nyayo House, Nairobi",                            link:{label:"eCitizen Portal",            url:"https://www.ecitizen.go.ke"}},
      {id:"t004",who:"wife",   text:"Apply for new Kenyan passport after dual citizenship approval",                                       link:{label:"eCitizen Portal",            url:"https://www.ecitizen.go.ke"}},
      {id:"t005",who:"wife",   text:"Apply for Kenyan National ID at Huduma Centre",                                                       link:{label:"Immigration Services",       url:"https://www.immigration.go.ke"}},
      {id:"t006",who:"wife",   text:"Apply for Nursing Council of Kenya (NCK) credential recognition — do before departure",              link:{label:"Nursing Council of Kenya",   url:"https://www.nursescouncil.or.ke"}},
      {id:"t007",who:"husband",text:"Register a business entity in Kenya to support Class G Investment Permit",                            link:{label:"Business Registration",      url:"https://www.businessregistration.go.ke"}},
      {id:"t008",who:"husband",text:"Apply for Class G Dependent Pass or Investment/Business Permit via eFNS Portal",                     link:{label:"eFNS Portal",                url:"https://fns.immigration.go.ke"}},
      {id:"t009",who:"son",    text:"Apply for Kenyan citizenship by descent (Form 30) — eligible via mother",                            link:{label:"Directorate of Immigration", url:"https://www.immigration.go.ke"}},
      {id:"t010",who:"son",    text:"Research university options: KUCCPS (public) and USIU-Africa, Strathmore (private)",                 link:{label:"KUCCPS Portal",              url:"https://www.kuccps.ac.ke"}},
      {id:"t011",who:"wife",   text:"Create Inspira profile on UN Careers — document every year of experience precisely; automated filters screen out incomplete profiles", link:{label:"UN Careers (Inspira)", url:"https://careers.un.org"}},
      {id:"t012",who:"wife",   text:"Register on WHO Stellis Health Systems Consultant Roster — separate from Inspira",                   link:{label:"WHO Stellis Portal",         url:"https://stellis.who.int"}},
      {id:"t013",who:"wife",   text:"Register consultancy firm on UNGM as a vendor to bid on larger contracts ($50K–$500K range)",        link:{label:"UNGM Registration",          url:"https://www.ungm.org"}},
      {id:"t014",who:"wife",   text:"Pivot LinkedIn profile: replace 'Nursing Administration' with 'Health Systems Strengthening (HSS)' — add JCI/CMS, EMR/ERP keywords"},
      {id:"t015",who:"wife",   text:"Set up daily job alerts on ReliefWeb and Devex for Nairobi health roles",                            link:{label:"ReliefWeb",                  url:"https://reliefweb.int"}},
      {id:"t016",who:"husband",text:"Research optimal Kenyan business structure: Sole Trader vs. Private Limited Company",                 link:{label:"Business Registration",      url:"https://www.businessregistration.go.ke"}},
      {id:"t017",who:"husband",text:"Check US landscaping equipment voltage compatibility (Kenya: 240V/50Hz vs US: 120V/60Hz)"},
      {id:"t018",who:"husband",text:"Join Nairobi Expat Entrepreneurs and Nairobi Business Network on LinkedIn/Facebook"},
      {id:"t019",who:"husband",text:"Research Export Promotion Council of Kenya for jewelry export incentives and licences",               link:{label:"Export Promotion Council",   url:"https://www.epckenya.org"}},
      {id:"t020",who:"family", text:"Decide US home strategy: retain and rent (recommended) vs. sell — do not rush this decision"},
      {id:"t021",who:"family", text:"If renting: engage US property management company — budget 8–12% of rental income for management fees"},
      {id:"t022",who:"family", text:"Verify Social Security earnings history for both spouses",                                            link:{label:"SSA.gov",                    url:"https://www.ssa.gov"}},
      {id:"t023",who:"family", text:"Engage a US expat tax CPA to plan FBAR, FATCA, and FEIE obligations before departure"},
      {id:"t024",who:"family", text:"Review 401(k) and IRA accounts — do NOT liquidate before age 59½ (10% penalty + income tax)",        link:{label:"IRS Retirement Plans",       url:"https://www.irs.gov"}},
      {id:"t025",who:"family", text:"Check IRS primary residence capital gains exclusion window ($500K jointly) — 2-of-5-year residency rule; act before window closes", link:{label:"IRS Capital Gains Info", url:"https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion"}},
    ]
  },
  {
    id:"ph2", badge:"Phase 2", title:"Pre-Departure Logistics", sub:"3–6 Months Before Move", icon:"📋",
    tasks:[
      {id:"t026",who:"wife",   text:"Submit dual citizenship declaration (Form 32) if not already done",                                   link:{label:"eCitizen Portal",            url:"https://www.ecitizen.go.ke"}},
      {id:"t027",who:"wife",   text:"Complete Kenyan passport application",                                                                link:{label:"eCitizen Portal",            url:"https://www.ecitizen.go.ke"}},
      {id:"t028",who:"son",    text:"Submit son's citizenship by descent (Form 30)",                                                       link:{label:"Directorate of Immigration", url:"https://www.immigration.go.ke"}},
      {id:"t029",who:"husband",text:"Submit spousal or business permit application via eFNS",                                              link:{label:"eFNS Portal",                url:"https://fns.immigration.go.ke"}},
      {id:"t030",who:"wife",   text:"Submit NCK credential recognition application",                                                       link:{label:"Nursing Council of Kenya",   url:"https://www.nursescouncil.or.ke"}},
      {id:"t031",who:"family", text:"Pre-register KRA PIN online — all adult family members",                                              link:{label:"KRA iTax Portal",            url:"https://itax.kra.go.ke"}},
      {id:"t032",who:"family", text:"Obtain FBI police clearance certificates (apostilled) for all adults",                                link:{label:"FBI Identity Check",         url:"https://www.fbi.gov/services/cjis/identity-history-summary-checks"}},
      {id:"t033",who:"family", text:"Apostille key documents (birth certs, marriage cert, degrees) via US Secretary of State"},
      {id:"t034",who:"family", text:"Set up US mail forwarding or a permanent PO Box before departure"},
      {id:"t035",who:"family", text:"Open USD bank account in Kenya before arrival — Standard Chartered Kenya or NCBA Bank"},
      {id:"t036",who:"family", text:"Prepare $10,000–$15,000 in liquid USD to cover first 3 months of arrival expenses"},
      {id:"t037",who:"family", text:"Notify US bank of international relocation — confirm account remains open (Schwab/Citibank recommended for expats)"},
      {id:"t038",who:"family", text:"Plan currency conversion strategy: convert USD → KES in tranches, not all at once"},
      {id:"t039",who:"wife",   text:"Target 2–3 video interviews with Nairobi-based employers before departure date"},
      {id:"t040",who:"husband",text:"Identify Nairobi landscaping equipment suppliers; source locally where possible to avoid import duties"},
    ]
  },
  {
    id:"ph3", badge:"Phase 3", title:"Immediate Arrival", sub:"First 1–3 Months in Nairobi", icon:"🏠",
    tasks:[
      {id:"t041",who:"family", text:"Register for KRA PIN — all family members (required for all major transactions in Kenya)",             link:{label:"KRA iTax Portal",            url:"https://itax.kra.go.ke"}},
      {id:"t042",who:"wife",   text:"Open Kenyan bank account (wife first, as citizen) — Equity Bank, KCB, or Standard Chartered"},
      {id:"t043",who:"family", text:"Register for NHIF (National Health Insurance Fund)",                                                  link:{label:"NHIF Registration",          url:"https://www.nhif.or.ke"}},
      {id:"t044",who:"family", text:"Register for NSSF (National Social Security Fund)",                                                  link:{label:"NSSF Registration",          url:"https://www.nssf.or.ke"}},
      {id:"t045",who:"family", text:"Collect National ID — wife and son (once citizenship is formally approved)",                          link:{label:"Huduma Centre",              url:"https://www.huduma.go.ke"}},
      {id:"t046",who:"family", text:"Convert US driving licences to Kenyan licences at NTSA — must be done within 90 days of arrival",    link:{label:"NTSA Portal",                url:"https://www.ntsa.go.ke"}},
      {id:"t047",who:"son",    text:"Register son for university or further education",                                                    link:{label:"KUCCPS Portal",              url:"https://www.kuccps.ac.ke"}},
      {id:"t048",who:"family", text:"Secure rental accommodation in a target neighbourhood (Lavington, Kilimani, Gigiri, or Karen)"},
      {id:"t049",who:"family", text:"Set up home utilities, internet, and security systems"},
      {id:"t050",who:"family", text:"Purchase comprehensive supplemental private health insurance for the whole family (Jubilee / Britam / AAR / CIC) — NHIF alone is insufficient"},
      {id:"t051",who:"wife",   text:"Join AmCham Kenya and sign up for the Healthcare Taskforce",                                          link:{label:"AmCham Kenya",               url:"https://www.amchamkenya.com"}},
      {id:"t052",who:"wife",   text:"Register with Kenya Health Professionals Association"},
      {id:"t053",who:"family", text:"Connect with the Diaspora Alliance of Kenya network"},
      {id:"t054",who:"family", text:"Attend first local professional networking event within 2 weeks of arrival"},
    ]
  },
  {
    id:"phA", badge:"Phase A", title:"UN Ecosystem Positioning", sub:"Wife — Professional Strategy", icon:"🌐",
    tasks:[
      {id:"t055",who:"wife",   text:"Finalise Inspira profile — document EVERY year of experience precisely; automated filters screen out profiles under stated minimums before any human sees them", link:{label:"UN Careers (Inspira)", url:"https://careers.un.org"}},
      {id:"t056",who:"wife",   text:"Submit WHO Stellis Health Systems Consultant Roster application",                                     link:{label:"WHO Stellis Portal",         url:"https://stellis.who.int"}},
      {id:"t057",who:"wife",   text:"Register consultancy firm on UNGM as a vendor — unlocks bidding on $50K–$500K contracts",             link:{label:"UNGM Registration",          url:"https://www.ungm.org"}},
      {id:"t058",who:"wife",   text:"Complete formal NCK credential verification (required for any local clinical consulting work)",        link:{label:"Nursing Council of Kenya",   url:"https://www.nursescouncil.or.ke"}},
      {id:"t059",who:"wife",   text:"Apply for P-4 and P-5 level roles on UN Careers Inspira",                                            link:{label:"UN Careers",                 url:"https://careers.un.org"}},
      {id:"t060",who:"wife",   text:"Submit applications to USAID implementing partners: Palladium, Abt Associates, JSI, and CHAI",        link:{label:"Devex",                      url:"https://www.devex.com"}},
      {id:"t061",who:"wife",   text:"Actively engage AmCham Kenya Healthcare Taskforce — connect with GE Healthcare and Philips directors", link:{label:"AmCham Kenya",               url:"https://www.amchamkenya.com"}},
      {id:"t062",who:"wife",   text:"Arrange introductory meetings with Chief Nursing Officers at Nairobi Hospital and Aga Khan University Hospital"},
      {id:"t063",who:"wife",   text:"Join UN Society Nairobi (open to contractors and consultants — key social/professional community)"},
      {id:"t064",who:"wife",   text:"Connect on LinkedIn with Health Officers and Chiefs of Section at UNON and USAID Kenya Health Portfolio"},
    ]
  },
  {
    id:"phB", badge:"Phase B", title:"Dual-Jurisdiction Tax Strategy", sub:"Husband — US & Kenya Business Tax", icon:"💼",
    tasks:[
      {id:"t065",who:"husband",text:"Engage a US expat CPA specialising in citizens abroad — critical before first Kenya tax year ends"},
      {id:"t066",who:"husband",text:"File annual IRS Form 1040 + Schedule SE — SE tax (~15.3%) is owed even on FEIE-excluded income",      link:{label:"IRS.gov",                    url:"https://www.irs.gov"}},
      {id:"t067",who:"husband",text:"File Form 2555 (FEIE) — up to ~$132,900 foreign-earned income exclusion for 2026; confirm eligibility via Physical Presence Test (330 days)", link:{label:"IRS Form 2555", url:"https://www.irs.gov/forms-pubs/about-form-2555"}},
      {id:"t068",who:"husband",text:"File Form 1116 (Foreign Tax Credit) to credit Kenyan taxes paid against US tax owed on same income — prevents double taxation", link:{label:"IRS Form 1116", url:"https://www.irs.gov/forms-pubs/about-form-1116"}},
      {id:"t069",who:"husband",text:"File annual FBAR (FinCEN Form 114) if Kenyan bank accounts exceed $10,000 at any point — penalties start at $10,000 for non-wilful failure", link:{label:"FinCEN FBAR Filing", url:"https://bsaefiling.fincen.treas.gov"}},
      {id:"t070",who:"husband",text:"File FATCA Form 8938 if combined foreign financial assets exceed $200,000 (jointly)",               link:{label:"IRS Form 8938",              url:"https://www.irs.gov/forms-pubs/about-form-8938"}},
      {id:"t071",who:"husband",text:"Register for KRA PIN and file annual Kenya income tax returns",                                       link:{label:"KRA iTax Portal",            url:"https://itax.kra.go.ke"}},
      {id:"t072",who:"husband",text:"Register for SEP tax at KRA if jewelry business sells to Kenyan customers online (3% on gross turnover from first dollar)", link:{label:"KRA iTax Portal", url:"https://itax.kra.go.ke"}},
      {id:"t073",who:"husband",text:"Register for VAT at KRA if annual business turnover exceeds KES 5 million (~$38,000)",               link:{label:"KRA iTax Portal",            url:"https://itax.kra.go.ke"}},
      {id:"t074",who:"husband",text:"Restructure US lawn care business as a separate LLC/S-Corp with a US-based operations manager — reduces Permanent Establishment risk in Kenya"},
      {id:"t075",who:"husband",text:"Apply for Gemstone Dealer Licence from Kenya State Department for Mining if sourcing Kenyan stones (Tsavorite etc.)", link:{label:"State Dept. for Mining", url:"https://www.mining.go.ke"}},
      {id:"t076",who:"husband",text:"Invoice all jewelry exports in USD to simplify FEIE calculations and KRA source-income documentation"},
    ]
  },
  {
    id:"ph4", badge:"Phase 4", title:"Stabilisation & Property", sub:"6–18 Months After Arrival", icon:"🏛️",
    tasks:[
      {id:"t077",who:"family", text:"Engage a licensed Kenyan advocate (lawyer) for all property transactions — never use agents as legal advisors"},
      {id:"t078",who:"family", text:"Conduct official Ministry of Lands title deed search to verify authenticity and no encumbrances",     link:{label:"Ministry of Lands (Ardhi)", url:"https://ardhi.go.ke"}},
      {id:"t079",who:"family", text:"Confirm land use classification of target property (residential vs. agricultural)"},
      {id:"t080",who:"family", text:"Check for unpaid land rates at the County Government"},
      {id:"t081",who:"family", text:"Check for unpaid land rent at KRA",                                                                   link:{label:"KRA iTax Portal",            url:"https://itax.kra.go.ke"}},
      {id:"t082",who:"family", text:"Complete property purchase — wife's name for freehold land/house; sectional property available to husband under Sectional Properties Act 2020", link:{label:"Sectional Properties Act", url:"https://www.kenyalaw.org"}},
      {id:"t083",who:"family", text:"Pay stamp duty: 4% on freehold land, 2% on leasehold/apartment"},
      {id:"t084",who:"husband",text:"Register landscaping company as Private Limited Company",                                             link:{label:"Business Registration",      url:"https://www.businessregistration.go.ke"}},
      {id:"t085",who:"husband",text:"Register jewelry brand as Private Limited Company or Sole Proprietorship",                            link:{label:"Business Registration",      url:"https://www.businessregistration.go.ke"}},
      {id:"t086",who:"wife",   text:"Register consultancy practice as Sole Proprietorship or Limited Liability Partnership",               link:{label:"Business Registration",      url:"https://www.businessregistration.go.ke"}},
      {id:"t087",who:"husband",text:"Register for PAYE at KRA once businesses begin hiring employees",                                     link:{label:"KRA iTax Portal",            url:"https://itax.kra.go.ke"}},
      {id:"t088",who:"family", text:"Open dedicated business bank accounts for each registered business"},
      {id:"t089",who:"husband",text:"Register landscaping and jewelry businesses on UNGM for UN supply contract bids",                     link:{label:"UNGM Registration",          url:"https://www.ungm.org"}},
    ]
  },
  {
    id:"ph5", badge:"Phase 5", title:"Long-Term Establishment", sub:"2–5 Years", icon:"🌱",
    tasks:[
      {id:"t090",who:"husband",text:"Apply for Kenyan citizenship by marriage (Form 8) at Year 7 of marriage to a Kenyan citizen",         link:{label:"Citizenship by Marriage",    url:"https://www.immigration.go.ke/citizenship-by-registration"}},
      {id:"t091",who:"wife",   text:"Formalise health consultancy firm with hired staff and expanded East Africa mandate"},
      {id:"t092",who:"husband",text:"Scale landscaping company — hire supervisors and move from doing labour to managing operations"},
      {id:"t093",who:"husband",text:"Establish jewelry brand presence at Village Market (UN Avenue) and regional trade shows"},
      {id:"t094",who:"family", text:"Begin planning 401(k)/IRA drawdown strategy as both spouses approach age 59½",                        link:{label:"IRS Retirement Guidance",    url:"https://www.irs.gov"}},
      {id:"t095",who:"family", text:"Make final US property decision (sell or retain) — time sale around capital gains exclusion carefully"},
      {id:"t096",who:"family", text:"Set up Social Security direct deposit to US account and confirm overseas benefit collection process",  link:{label:"Social Security Administration", url:"https://www.ssa.gov"}},
      {id:"t097",who:"family", text:"Select private health insurance plan bridging Medicare gap (ages 50–65) — do not underinsure"},
      {id:"t098",who:"family", text:"Consider purchasing a second Nairobi investment property in wife's name for rental yield",             link:{label:"Ministry of Lands",          url:"https://ardhi.go.ke"}},
      {id:"t099",who:"family", text:"Conduct annual review: file FBAR, Form 1040, and Kenya tax returns — maintain full dual-compliance",  link:{label:"FinCEN FBAR",                url:"https://bsaefiling.fincen.treas.gov"}},
      {id:"t100",who:"family", text:"5-year strategic review: assess optimal allocation between Kenya real estate, US assets, and export business expansion"},
    ]
  },
];

const TOTAL = PHASES.reduce((s, p) => s + p.tasks.length, 0);
const FILTERS = [
  {key:"all",     label:"All"},
  {key:"wife",    label:"Wife"},
  {key:"husband", label:"Husband"},
  {key:"son",     label:"Son"},
  {key:"family",  label:"Family"},
  {key:"pending", label:"Pending"},
  {key:"done",    label:"Done ✓"},
];

function CircleProgress({ pct }) {
  const R = 56, C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;
  return (
    <svg width={148} height={148} viewBox="0 0 148 148">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD2} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <circle cx={74} cy={74} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={11} />
      <circle
        className="progress-arc"
        cx={74} cy={74} r={R}
        fill="none"
        stroke="url(#goldGrad)"
        strokeWidth={11}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        transform="rotate(-90 74 74)"
      />
    </svg>
  );
}

export default function App() {
  const [checked, setChecked]   = useState({});
  const [open,    setOpen]      = useState({ ph1: true });
  const [filter,  setFilter]    = useState("all");
  const [ready,   setReady]     = useState(false);
  const saveTimer  = useRef(null);
  const fromRemote = useRef(false);
  const isLoaded   = useRef(false);

  useEffect(() => {
    loadChecked().then(data => {
      setChecked(data);
      isLoaded.current = true;
      setReady(true);
    });

    const channel = supabase
      .channel("progress-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "progress" },
        payload => {
          fromRemote.current = true;
          setChecked(payload.new.checked);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!ready || !isLoaded.current) return;
    if (fromRemote.current) { fromRemote.current = false; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveChecked(checked), 800);
  }, [checked, ready]);

  const toggle     = useCallback(id  => setChecked(p => ({ ...p, [id]: !p[id] })), []);
  const toggleOpen = useCallback(id  => setOpen(p    => ({ ...p, [id]: !p[id] })), []);

  const done  = Object.values(checked).filter(Boolean).length;
  const pct   = Math.round((done / TOTAL) * 100);

  const passes = t => {
    if (filter === "all")     return true;
    if (filter === "done")    return !!checked[t.id];
    if (filter === "pending") return !checked[t.id];
    return t.who === filter;
  };

  if (!ready) return (
    <div style={{ background: FOREST, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{CSS}</style>
      <span style={{ fontFamily:"'Playfair Display',serif", color: GOLD, fontSize:18 }}>Loading your progress…</span>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background: CREAM }}>
      <style>{CSS}</style>

      <header style={{
        background: `linear-gradient(145deg, ${FOREST} 0%, #1B5E42 55%, #0A2A1E 100%)`,
        padding:"36px 24px 28px", position:"relative", overflow:"hidden"
      }}>
        <div style={{
          position:"absolute", inset:0, opacity:.04,
          backgroundImage:"repeating-linear-gradient(60deg,#C9963E 0,#C9963E 1px,transparent 0,transparent 28px),repeating-linear-gradient(-60deg,#C9963E 0,#C9963E 1px,transparent 0,transparent 28px)",
          pointerEvents:"none"
        }}/>

        <div style={{ maxWidth:840, margin:"0 auto", display:"flex", gap:28, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ position:"relative", flexShrink:0, width:148, height:148 }}>
            <CircleProgress pct={pct} />
            <div style={{
              position:"absolute", inset:0, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center"
            }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:700, color:GOLD, lineHeight:1 }}>{pct}%</span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:1.5, marginTop:4 }}>Complete</span>
            </div>
          </div>

          <div style={{ flex:1, minWidth:180 }}>
            <p style={{ fontSize:10, color:GOLD, letterSpacing:3.5, textTransform:"uppercase", fontWeight:600, marginBottom:6 }}>
              Relocation Progress Tracker
            </p>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: "clamp(28px, 4.5vw, 38px)", fontWeight:700, color:WHITE, lineHeight:1.15, marginBottom:8 }}>
              The Blakey<br/>
              <em style={{ color:GOLD, fontStyle:"italic" }}>Relocation</em>
            </h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginBottom:18 }}>
              United States → Nairobi, Kenya
            </p>

            <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
              {[
                {v: done,         label:"Done",      c: GOLD},
                {v: TOTAL - done, label:"Remaining", c:"rgba(255,255,255,.45)"},
                {v: TOTAL,        label:"Total",     c:"rgba(255,255,255,.45)"},
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:s.c, lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.38)", textTransform:"uppercase", letterSpacing:1.2, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div style={{ height:5, background:"rgba(13,59,46,.9)" }}>
        <div className="progress-bar-fill" style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${GOLD},${GOLD2})` }}/>
      </div>

      <div style={{ background:FOREST2, padding:"10px 20px", display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:2, marginRight:4 }}>Filter</span>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const fgMap = {wife:"#CE93D8",husband:"#90CAF9",son:"#FFAB91",family:"#A5D6A7",done:"#80CBC4",pending:"#FFD54F",all:WHITE};
          return (
            <button key={f.key} className="filter-chip" onClick={() => setFilter(f.key)}
              style={{
                padding:"4px 14px", borderRadius:20, fontSize:11, fontWeight:600,
                background: active ? fgMap[f.key]||WHITE : "rgba(255,255,255,.1)",
                color: active ? FOREST : "rgba(255,255,255,.65)",
              }}>
              {f.label}
            </button>
          );
        })}
      </div>

      <main style={{ maxWidth:840, margin:"0 auto", padding:"24px 16px 64px" }}>
        {PHASES.map(phase => {
          const visible = phase.tasks.filter(passes);
          if (!visible.length) return null;
          const pDone = phase.tasks.filter(t => checked[t.id]).length;
          const pPct  = Math.round((pDone / phase.tasks.length) * 100);
          const isOpen = open[phase.id] !== false;

          return (
            <div key={phase.id} className="phase-card">
              <button className="phase-hdr" onClick={() => toggleOpen(phase.id)}
                style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:22 }}>{phase.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:GOLD, textTransform:"uppercase", letterSpacing:2.5 }}>{phase.badge}</span>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:FOREST }}>{phase.title}</span>
                    <span style={{ fontSize:12, color:"#999" }}>{phase.sub}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:7 }}>
                    <div style={{ flex:1, height:4, borderRadius:2, background:"#EEE8DA", overflow:"hidden" }}>
                      <div className="phase-fill" style={{ height:"100%", borderRadius:2, width:`${pPct}%`, background: pPct===100?"#1E6B47":GOLD }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color: pPct===100?"#1E6B47":"#AAA", minWidth:40 }}>
                      {pDone}/{phase.tasks.length}
                    </span>
                  </div>
                </div>
                <span className={`arrow${isOpen?" open":""}`} style={{ color:GOLD, fontSize:20, marginLeft:4 }}>›</span>
              </button>

              {isOpen && (
                <div style={{ borderTop:"1px solid #F0EAE0" }}>
                  {visible.map((t, i) => {
                    const isDone = !!checked[t.id];
                    const W = WHO[t.who];
                    return (
                      <div key={t.id} className={`task-row${isDone?" done-row":""}`}
                        onClick={() => toggle(t.id)}
                        style={{
                          display:"flex", alignItems:"flex-start", gap:12,
                          padding:"13px 20px",
                          borderBottom: i < visible.length-1 ? "1px solid #F5F0E8" : "none",
                        }}>
                        <div className="chk" style={{
                          marginTop:2, width:22, height:22, borderRadius:6, flexShrink:0,
                          border: isDone ? "none" : "2px solid #CEBFA8",
                          background: isDone ? "#1E6B47" : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center"
                        }}>
                          {isDone && (
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                              <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          <p className={isDone ? "done-text" : ""} style={{ fontSize:13, color:"#222", lineHeight:1.55, marginBottom:6 }}>
                            {t.text}
                          </p>
                          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                            <span style={{
                              fontSize:9.5, fontWeight:700, padding:"2px 9px", borderRadius:10,
                              background:W.bg, color:W.fg, textTransform:"uppercase", letterSpacing:.8, flexShrink:0
                            }}>{W.label}</span>
                            {t.link && (
                              <a href={t.link.url} target="_blank" rel="noopener noreferrer"
                                className="link-pill"
                                onClick={e => e.stopPropagation()}
                                style={{
                                  fontSize:11, padding:"2px 10px", borderRadius:10,
                                  background:"#E8F0FD", color:"#1455A4", fontWeight:600
                                }}>
                                {t.link.label}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
