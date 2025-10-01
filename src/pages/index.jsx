import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Receipts from "./Receipts";

import BillSplitter from "./BillSplitter";

import Fitness from "./Fitness";

import Goals from "./Goals";

import GoalDetails from "./GoalDetails";

import FamilyMap from "./FamilyMap";

import Polls from "./Polls";

import TravelPlanning from "./TravelPlanning";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Receipts: Receipts,
    
    BillSplitter: BillSplitter,
    
    Fitness: Fitness,
    
    Goals: Goals,
    
    GoalDetails: GoalDetails,
    
    FamilyMap: FamilyMap,
    
    Polls: Polls,
    
    TravelPlanning: TravelPlanning,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Receipts" element={<Receipts />} />
                
                <Route path="/BillSplitter" element={<BillSplitter />} />
                
                <Route path="/Fitness" element={<Fitness />} />
                
                <Route path="/Goals" element={<Goals />} />
                
                <Route path="/GoalDetails" element={<GoalDetails />} />
                
                <Route path="/FamilyMap" element={<FamilyMap />} />
                
                <Route path="/Polls" element={<Polls />} />
                
                <Route path="/TravelPlanning" element={<TravelPlanning />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}