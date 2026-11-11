import React, { useState } from 'react';
import { Download, HardDrive, Upload } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { MilestoneNotice } from '../components/ui/MilestoneNotice';

export const BackupRestorePage: React.FC = () => {
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="สำรองและกู้คืนข้อมูล"
        description="จัดการสำรองข้อมูลและนำเข้าข้อมูลในรูปแบบไฟล์ JSON สำหรับการใช้งานแบบ Local-First"
      />

      {/* Local-First Storage Explanation */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">
            การจัดเก็บข้อมูลภายในเบราว์เซอร์ (IndexedDB)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            ระบบนี้ออกแบบให้จัดเก็บข้อมูลทั้งหมดไว้ภายในเครื่องของผู้ใช้งานผ่าน IndexedDB โดยไม่ต้องเข้าสู่ระบบและไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์ภายนอก
            สำหรับระยะที่ 1 ระบบยังไม่เชื่อมต่อฐานข้อมูล และการสำรอง/กู้คืนไฟล์ JSON จะเปิดใช้งานในขั้นตอนถัดไป
          </p>
        </div>
      </section>

      {noticeMessage && (
        <MilestoneNotice
          title="ฟังก์ชันนี้ยังไม่เปิดใช้งานในระยะที่ 1"
          description={noticeMessage}
          onDismiss={() => setNoticeMessage(null)}
        />
      )}

      {/* Backup & Restore Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              สำรองข้อมูล (Export JSON)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              ส่งออกข้อมูลการสอบ รายชื่อผู้เข้าสอบ คลังคำถาม เกณฑ์การให้คะแนน และผลการประเมินทั้งหมดเป็นไฟล์ JSON เพื่อเก็บรักษาไว้ในเครื่อง
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">สถานะ: ยังไม่เปิดใช้งาน</span>
            <button
              type="button"
              onClick={() =>
                setNoticeMessage(
                  'การส่งออกไฟล์สำรองข้อมูล JSON จะพัฒนาในขั้นตอนถัดไปหลังจากเชื่อมต่อ IndexedDB เรียบร้อยแล้ว'
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>สำรองข้อมูล (JSON)</span>
            </button>
          </div>
        </section>

        {/* Restore Section */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              กู้คืนข้อมูล (Import JSON)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              นำเข้าไฟล์สำรองข้อมูล JSON จากเครื่องของคุณเพื่อเรียกคืนข้อมูลเดิมกลับมาใช้งานบนเบราว์เซอร์นี้
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">สถานะ: ยังไม่เปิดใช้งาน</span>
            <button
              type="button"
              onClick={() =>
                setNoticeMessage(
                  'การนำเข้าไฟล์สำรองข้อมูล JSON จะพัฒนาในขั้นตอนถัดไปหลังจากเชื่อมต่อ IndexedDB เรียบร้อยแล้ว'
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>กู้คืนข้อมูล (JSON)</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
