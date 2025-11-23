import React, { useState } from 'react';
import { 
  Plus, Search, MoreHorizontal, Calendar, 
  Users, Layout, Bell, Sparkles, Filter 
} from 'lucide-react';

const SimpleDashboard = () => {
  const [filter, setFilter] = useState('All');

  // Données factices colorées
  const projects = [
    { id: 1, title: "Q4 Marketing Blast", tag: "MARKETING", date: "2h ago", color: "bg-yellow-300", users: 4 },
    { id: 2, title: "Mobile App Wireframes", tag: "PRODUCT", date: "1d ago", color: "bg-blue-300", users: 2 },
    { id: 3, title: "Team Retrospective", tag: "HR", date: "3d ago", color: "bg-pink-300", users: 8 },
    { id: 4, title: "System Architecture", tag: "DEV", date: "1w ago", color: "bg-green-300", users: 3 },
    { id: 5, title: "Client Presentation", tag: "SALES", date: "2w ago", color: "bg-purple-300", users: 1 },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between">
        
        {/* Logo Area */}
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-xl group-hover:rotate-12 transition-transform shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]">
            F.
          </div>
          <span className="text-2xl font-black tracking-tighter">FRAYM</span>
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {['Dashboard', 'Community', 'Templates'].map((item, i) => (
            <button 
              key={item}
              className={`px-6 py-2 font-bold border-2 rounded-full transition-all 
              ${i === 0 
                ? 'bg-yellow-300 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1' 
                : 'border-transparent hover:bg-gray-100 hover:border-black'}`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="relative">
             <Bell className="w-6 h-6 hover:rotate-12 transition-transform cursor-pointer" />
             <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-black rounded-full"></span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-200 overflow-hidden cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="relative w-full md:w-auto">
            <h1 className="text-6xl md:text-7xl font-black mb-2 relative z-10">
              My Boards<span className="text-yellow-400">.</span>
            </h1>
            {/* Decoration line */}
            <div className="h-4 w-full bg-yellow-300 absolute bottom-2 left-2 -z-0 opacity-50 transform -skew-x-12"></div>
            <p className="text-xl font-bold text-gray-500 mt-2 font-mono">Let's build something chaotic today.</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
             {/* Search Input */}
             <div className="relative flex-1 md:w-64">
                <input 
                  type="text" 
                  placeholder="Find a board..." 
                  className="w-full h-14 pl-4 pr-10 border-4 border-black font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-gray-50"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6" />
             </div>
             
             {/* Create Button */}
             <button className="h-14 px-8 bg-black text-white font-black text-lg border-4 border-transparent hover:bg-white hover:text-black hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 whitespace-nowrap">
                <Plus strokeWidth={3} /> NEW
             </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 border-2 border-black px-3 py-1 bg-white font-bold mr-2">
                <Filter size={16} /> Filter:
            </div>
            {['All', 'Marketing', 'Product', 'Dev', 'Archived'].map(tag => (
                <button 
                    key={tag}
                    onClick={() => setFilter(tag)}
                    className={`px-4 py-1 font-bold border-2 rounded-lg transition-all whitespace-nowrap
                    ${filter === tag 
                        ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]' 
                        : 'bg-white border-black hover:bg-yellow-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                    {tag}
                </button>
            ))}
        </div>

        {/* GRID OF PROJECTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* 1. THE "NEW PROJECT" CARD (Special Style) */}
          <div className="group relative h-72 border-4 border-dashed border-gray-400 bg-gray-50 hover:bg-white hover:border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col items-center justify-center gap-4">
             <div className="w-20 h-20 bg-white border-4 border-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Sparkles size={32} className="text-black" />
             </div>
             <div className="text-center">
                <h3 className="text-2xl font-black">Create Blank</h3>
                <p className="font-mono text-sm text-gray-500 mt-1">Start from scratch</p>
             </div>
          </div>

          {/* 2. PROJECT CARDS */}
          {projects.map((project) => (
            <div 
              key={project.id}
              className="group relative h-72 bg-white border-4 border-black flex flex-col justify-between p-6 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer overflow-hidden"
            >
              {/* Background Decoration (Abstract Shapes) */}
              <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${project.color} border-4 border-black transition-transform group-hover:scale-125`} />
              
              {/* Top: Tag & Actions */}
              <div className="relative z-10 flex justify-between items-start">
                 <span className="inline-block px-3 py-1 bg-white border-2 border-black text-xs font-black tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {project.tag}
                 </span>
                 <button className="p-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded transition-colors">
                    <MoreHorizontal size={24} />
                 </button>
              </div>

              {/* Middle: Title */}
              <div className="relative z-10 mt-4">
                 <h3 className="text-3xl font-black leading-none group-hover:underline decoration-4 decoration-yellow-300 underline-offset-4">
                    {project.title}
                 </h3>
              </div>

              {/* Bottom: Meta Info */}
              <div className="relative z-10 flex justify-between items-end mt-auto pt-6 border-t-2 border-gray-100 group-hover:border-black transition-colors">
                 <div className="flex items-center gap-2 text-sm font-bold font-mono text-gray-500 group-hover:text-black">
                    <Calendar size={14} /> {project.date}
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <div className="flex -space-x-3">
                        {[...Array(Math.min(3, project.users))].map((_,i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center text-xs font-bold">
                                {String.fromCharCode(65+i)}
                            </div>
                        ))}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                        <Users size={14} />
                    </div>
                 </div>
              </div>
            </div>
          ))}

        </div>
      </main>

    </div>
  );
};

export default SimpleDashboard;