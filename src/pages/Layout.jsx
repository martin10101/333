

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  Receipt,
  StickyNote,
  ChefHat,
  Dumbbell,
  Trophy,
  CheckCircle2,
  CreditCard,
  Menu,
  X,
  Calculator,
  PiggyBank,
  Video,
  MapPin,
  Vote
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
    description: "Family overview"
  },
  {
    title: "Family Map",
    url: createPageUrl("FamilyMap"),
    icon: MapPin,
    description: "See where everyone is"
  },
  {
    title: "Family Polls",
    url: createPageUrl("Polls"),
    icon: Vote,
    description: "Vote on decisions",
    highlight: true
  },
  {
    title: "Bill Splitter",
    url: createPageUrl("BillSplitter"),
    icon: Calculator,
    description: "Split restaurant bills"
  },
  {
    title: "Family Vault",
    url: createPageUrl("Goals"),
    icon: PiggyBank,
    description: "Shared savings goals"
  },
  {
    title: "Travel Planning",
    url: createPageUrl("TravelPlanning"),
    icon: Video,
    description: "Plan your next adventure"
  },
  {
    title: "Receipts",
    url: createPageUrl("Receipts"),
    icon: Receipt,
    description: "Expense tracking"
  },
  {
    title: "Notes & Tasks",
    url: createPageUrl("Notes"),
    icon: StickyNote,
    description: "Family organization"
  },
  {
    title: "Recipes",
    url: createPageUrl("Recipes"),
    icon: ChefHat,
    description: "Meal planning"
  },
  {
    title: "Fitness",
    url: createPageUrl("Fitness"),
    icon: Dumbbell,
    description: "Health tracking"
  },
  {
    title: "Achievements",
    url: createPageUrl("Achievements"),
    icon: Trophy,
    description: "Goals & rewards"
  },
  {
    title: "Approvals",
    url: createPageUrl("Approvals"),
    icon: CheckCircle2,
    description: "Family decisions"
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white">
          <SidebarHeader className="border-b border-slate-200/80 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Family Hub</h2>
                <p className="text-xs text-slate-500 font-medium">Life Management Suite</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mb-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`group hover:bg-slate-100 transition-all duration-300 rounded-xl p-3 ${
                          location.pathname === item.url
                            ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 relative">
                          <item.icon className={`w-5 h-5 transition-all duration-300 ${
                            location.pathname === item.url
                              ? 'text-amber-400'
                              : 'text-slate-500 group-hover:text-slate-700'
                          }`} />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{item.title}</span>
                            <span className={`text-xs ${
                              location.pathname === item.url
                                ? 'text-slate-300'
                                : 'text-slate-500'
                            }`}>
                              {item.description}
                            </span>
                          </div>
                          {item.highlight && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/80 p-6">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">Family Account</p>
                <p className="text-xs text-slate-600 truncate">Manage your household</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50/50 overflow-x-hidden">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-4 py-3 md:hidden sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-base font-bold text-slate-900">Family Hub</h1>
              <div className="w-8" /> {/* Spacer */}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 768px) {
          .min-w-max {
            min-width: max-content;
          }
        }
      `}</style>
    </SidebarProvider>
  );
}

