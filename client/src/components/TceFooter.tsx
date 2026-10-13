import React from 'react';
import { ExternalLink, ShieldCheck, Award, BookOpen, MapPin, Phone, Mail } from 'lucide-react';
import { TceLogo } from './TceLogo';

export const TceFooter: React.FC = () => {
  return (
    <footer className="mt-16 bg-[#091A2A] text-slate-300 border-t-4 border-[#C59B27] font-sans">
      {/* Top Footer Banner */}
      <div className="bg-[#7B1113] text-white py-3 px-4 border-b border-[#C59B27]/30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-[#E2BF53] flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-[#E2BF53]" />
              <span>Accredited with 'A+' Grade by NAAC</span>
            </span>
            <span className="hidden sm:inline text-white/50">•</span>
            <span className="hidden sm:inline">Approved by AICTE, New Delhi</span>
            <span className="hidden md:inline text-white/50">•</span>
            <span className="hidden md:inline">NIRF Engineering Top Ranked Institution</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-white/80">
            <span>Autonomous Since 1987</span>
            <span>•</span>
            <span className="font-bold text-[#E2BF53]">Regulation 2026 OBE Framework</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: TCE Info */}
          <div className="md:col-span-1 space-y-3">
            <TceLogo variant="white" subtext="Autonomous Institution Affiliated to Anna University" />
            <p className="text-xs text-slate-400 leading-relaxed mt-3">
              Founded in 1957 by philanthropist Karumuttu Thiagarajan Chettiar, TCE provides world-class education focused on technical excellence, research and ethical leadership.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#C59B27] flex-shrink-0 mt-0.5" />
                <span>Thiruparankundram, Madurai - 625 015, Tamil Nadu, India</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#C59B27] flex-shrink-0" />
                <span>+91 452 2482240 / 241</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#C59B27] flex-shrink-0" />
                <span>principal@tce.edu</span>
              </div>
            </div>
          </div>

          {/* Column 2: Academic & Curriculum */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700 pb-1.5 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-[#C59B27]" />
              <span>Curriculum & OBE</span>
            </h4>
            <ul className="text-xs space-y-2 text-slate-400">
              <li>
                <span className="text-slate-300 font-medium">Regulation 2026 Framework</span>
              </li>
              <li>
                <span>Thiagarajar Proficiency Scale (TPS) Taxonomy</span>
              </li>
              <li>
                <span>CDIO Syllabus Alignment & PIs</span>
              </li>
              <li>
                <span>UN Sustainable Development Goals (SDG)</span>
              </li>
              <li>
                <span>Board of Studies (BoS) Formats</span>
              </li>
              <li>
                <span>Academic Council Meeting (ACM) Bundles</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Institutional Systems */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700 pb-1.5 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
              <span>Institutional Links</span>
            </h4>
            <ul className="text-xs space-y-2 text-slate-400">
              <li>
                <a
                  href="https://www.tce.edu/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#E2BF53] flex items-center space-x-1 transition-colors"
                >
                  <span>Official TCE Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.tce.edu/academics/regulations"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#E2BF53] flex items-center space-x-1 transition-colors"
                >
                  <span>Academic Regulations</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.tce.edu/academics/exams"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#E2BF53] flex items-center space-x-1 transition-colors"
                >
                  <span>Office of Controller of Examinations</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.tce.edu/nirf/ranking"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#E2BF53] flex items-center space-x-1 transition-colors"
                >
                  <span>NIRF Disclosures</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: System Governance & Quick Action */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700 pb-1.5">
              Academic Portal
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated institutional compliance engine for B.E., B.Tech, M.E., M.Tech, and M.C.A. courses under Regulation 2026.
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Active Regulation:</span>
                <span className="font-bold text-[#E2BF53]">2026</span>
              </div>
              <div className="flex justify-between">
                <span>Validation Engine:</span>
                <span className="text-emerald-400 font-semibold">B1 - B12 Active</span>
              </div>
              <div className="flex justify-between">
                <span>Document Engine:</span>
                <span className="text-sky-400 font-semibold">TCE Official Word & PDF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            © {new Date().getFullYear()} Thiagarajar College of Engineering, Madurai. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Use</span>
            <span>•</span>
            <span>Curriculum Portal v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
