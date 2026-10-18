import PageHeader from './components/PageHeader.jsx';
import React, { useState } from "react";
import {
  Search, MapPin, BriefcaseBusiness, SlidersHorizontal,
  Star, Globe, Mail, ArrowUpRight, Users,
  RotateCcw
} from "lucide-react";
import "./FindExperts.css";
import "./Readiness.css";

const industries = ["All industries", "Food & Restaurants", "Retail", "Technology", "Construction", "Healthcare"];
const services = ["All services", "Accounting & Taxes", "Legal Services", "Marketing", "Business Consulting", "Permits & Licensing"];

// Fictional profiles for UI testing. Replace with API results later.
const experts = [
  { id: 1, name: "Peachtree Tax Advisors", service: "Accounting & Taxes", industries: ["Food & Restaurants", "Retail"], city: "Atlanta", state: "GA", zip: "30303", distance: 3, rating: 4.8, reviews: 86, description: "Tax planning, bookkeeping, and payroll support for independent small businesses.", initials: "PT" },
  { id: 2, name: "Piedmont Business Law", service: "Legal Services", industries: ["Food & Restaurants", "Technology", "Retail"], city: "Atlanta", state: "GA", zip: "30309", distance: 7, rating: 4.9, reviews: 62, description: "Business formation, contracts, and commercial compliance guidance.", initials: "PB" },
  { id: 3, name: "Atlanta Growth Studio", service: "Marketing", industries: ["Food & Restaurants", "Retail", "Technology"], city: "Atlanta", state: "GA", zip: "30308", distance: 5, rating: 4.7, reviews: 43, description: "Local SEO, brand strategy, and social campaigns for growing businesses.", initials: "AG" },
  { id: 4, name: "Northside Permit Partners", service: "Permits & Licensing", industries: ["Food & Restaurants", "Construction", "Healthcare"], city: "Atlanta", state: "GA", zip: "30318", distance: 16, rating: 4.6, reviews: 28, description: "Application organization and licensing process support.", initials: "NP" },
  { id: 5, name: "Austin Small Business CPAs", service: "Accounting & Taxes", industries: ["Technology", "Retail", "Construction"], city: "Austin", state: "TX", zip: "78701", distance: 4, rating: 4.8, reviews: 71, description: "Bookkeeping and tax preparation for owners and startups.", initials: "AC" },
  { id: 6, name: "Capital City Business Counsel", service: "Legal Services", industries: ["Technology", "Healthcare", "Construction"], city: "Austin", state: "TX", zip: "78702", distance: 9, rating: 4.7, reviews: 39, description: "Practical contract and formation support for businesses.", initials: "CC" },
  { id: 7, name: "Seattle Startup Strategy", service: "Business Consulting", industries: ["Technology", "Retail"], city: "Seattle", state: "WA", zip: "98101", distance: 6, rating: 4.9, reviews: 34, description: "Operations planning and growth support for early-stage teams.", initials: "SS" },
  { id: 8, name: "Soundview Marketing Co.", service: "Marketing", industries: ["Healthcare", "Retail", "Food & Restaurants"], city: "Seattle", state: "WA", zip: "98109", distance: 11, rating: 4.7, reviews: 52, description: "Digital presence and customer acquisition for neighborhood businesses.", initials: "SM" }
];

const demoLocations = [
  { city: "Atlanta", state: "GA", zip: "30303" },
  { city: "Austin", state: "TX", zip: "78701" },
  { city: "Seattle", state: "WA", zip: "98101" }
];

function findDemoLocation(input) {
  const value = input.trim().toLowerCase();
  return demoLocations.find(loc =>
    value === loc.city.toLowerCase() ||
    value === `${loc.city}, ${loc.state}`.toLowerCase() ||
    value === loc.zip
  );
}

export default function FindExperts(headerControls) {
  const [industry, setIndustry] = useState("All industries");
  const [service, setService] = useState("All services");
  const [location, setLocation] = useState("Atlanta, GA");
  const [radius, setRadius] = useState("25");
  const [filters, setFilters] = useState(null);

  function search(e) {
    e.preventDefault();
    setFilters({ industry, service, location: location.trim(), radius: Number(radius) });
  }

  function reset() {
    setIndustry("All industries");
    setService("All services");
    setLocation("Atlanta, GA");
    setRadius("25");
    setFilters(null);
  }

  const selectedLocation = filters ? findDemoLocation(filters.location) : null;
  const results = !filters || !selectedLocation ? [] : experts
    .filter(expert => expert.city === selectedLocation.city)
    .filter(expert => expert.distance <= filters.radius)
    .filter(expert => filters.service === "All services" || expert.service === filters.service)
    .filter(expert => filters.industry === "All industries" || expert.industries.includes(filters.industry))
    .sort((a, b) => b.rating - a.rating);

  return (
    <section className="fe-page">
      <PageHeader
        {...headerControls}
        title="Find the right expert for your business."
        eyebrow={<div className="fe-topline"><BriefcaseBusiness size={16} /> CLEARBRIDGE EXPERT NETWORK</div>}
        description="Explore professional services based on your industry, location, and business needs."
      />

      <form className="fe-search" onSubmit={search}>
        <div className="fe-search-title"><SlidersHorizontal size={19} /> Match with an expert</div>
        <div className="fe-fields">
          <label>Business industry
            <select value={industry} onChange={e => setIndustry(e.target.value)}>
              {industries.map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>Service needed
            <select value={service} onChange={e => setService(e.target.value)}>
              {services.map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>City, state, or ZIP code
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Atlanta, GA" required />
          </label>
          <label>Within
            <select value={radius} onChange={e => setRadius(e.target.value)}>
              {[5, 10, 25, 50].map(x => <option value={x} key={x}>{x} miles</option>)}
            </select>
          </label>
        </div>
        <div className="fe-actions">
          <button className="fe-primary" type="submit"><Search size={17} /> Find experts</button>
          <button className="fe-reset" type="button" onClick={reset}><RotateCcw size={16} /> Reset</button>
        </div>
      </form>


      {filters ? (
        <div className="fe-results">
          <div className="fe-results-heading">
            <div><h2>{results.length} matching {results.length === 1 ? "expert" : "experts"}</h2><p>Within {filters.radius} miles of {filters.location}</p></div>
            <span className="fe-count"><Users size={15} /> Demo results</span>
          </div>
          {!selectedLocation ? (
            <div className="fe-empty"><MapPin size={28}/><h3>Location not in demo data</h3><p>Try Atlanta, GA; Austin, TX; or Seattle, WA. We can connect Google Places for more locations.</p></div>
          ) : results.length === 0 ? (
            <div className="fe-empty"><Search size={28}/><h3>No matches in this demo</h3><p>Try a larger radius, another service, or “All industries.”</p></div>
          ) : (
            <div className="fe-grid">
              {results.map(expert => (
                <article className="fe-card" key={expert.id}>
                  <div className="fe-card-top"><div className="fe-monogram">{expert.initials}</div><span className="fe-rating"><Star size={15} fill="currentColor"/> {expert.rating} <small>({expert.reviews})</small></span></div>
                  <h3>{expert.name}</h3>
                  <span className="fe-category">{expert.service}</span>
                  <p className="fe-description">{expert.description}</p>
                  <div className="fe-details"><span><MapPin size={15}/>{expert.city}, {expert.state} · ~{expert.distance} mi</span><span><BriefcaseBusiness size={15}/>{expert.industries.join(" · ")}</span></div>
                  <div className="fe-card-actions">
                    <button type="button" onClick={() => alert("Demo profile only. Real contact information will appear after we connect live listings.")}><Mail size={16}/> Contact</button>
                    <button type="button" onClick={() => alert("Demo listing — there is no verified website yet.")}><Globe size={16}/> Website <ArrowUpRight size={14}/></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
