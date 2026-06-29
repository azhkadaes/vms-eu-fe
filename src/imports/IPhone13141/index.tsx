import svgPaths from "./svg-6gklevel8y";
import imgImage3 from "./bb7b728a1a6e3f913073a407a73a558eb5867bcf.png";
import imgLogo11 from "./a9831c90286c93afd5ddc0ae3f97d4e76acee910.png";

function Frame2() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start leading-[normal] not-italic relative shrink-0 text-white w-full">
      <p className="font-['Inter:Medium',sans-serif] font-medium min-w-full relative shrink-0 text-[40px] w-[min-content]">Selamat Datang di Otorita IKN</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[18px] w-[285px]">Mulai perjalanan Anda menuju Ibu Kota Nusantara, pesan kunjungan Anda hari ini.</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[25px] top-[446px] w-[334px]">
      <Frame2 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[304px]">
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#2e7465] text-[12px] whitespace-nowrap">Buat Kunjungan</p>
      <div className="flex h-[13px] items-center justify-center relative shrink-0 w-[6px]">
        <div className="-rotate-90 flex-none">
          <div className="h-[6px] relative w-[13px]" data-name="Vector">
            <div className="absolute inset-[-15.78%_-7.28%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8938 7.89375">
                <path d={svgPaths.p27acd7c0} id="Vector" stroke="var(--stroke-0, #2E7465)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.89375" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[rgba(255,255,255,0.71)] h-[54px] relative rounded-[6px] shrink-0 w-full">
      <div aria-hidden className="absolute border border-[#2e7465] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center pb-[9px] pl-[10px] pr-[14px] pt-[8px] relative size-full">
          <Frame />
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[14px] items-start justify-center left-[25px] top-[686px] w-[334px]">
      <Frame1 />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[12px] text-white w-full">
        <span className="leading-[normal]">{`Sudah membuat kunjungan? `}</span>
        <span className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] text-[#3f9e89]">Cek PIN Booking.</span>
      </p>
    </div>
  );
}

export default function IPhone() {
  return (
    <div className="bg-white overflow-clip relative rounded-[40px] size-full" data-name="iPhone 13 & 14 - 1">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[862px] left-[calc(50%-6px)] top-[calc(50%+8px)] w-[1532px]" data-name="image 3">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage3} />
      </div>
      <div className="absolute bg-gradient-to-b from-[rgba(155,139,177,0.68)] h-[844px] left-0 to-[rgba(0,0,0,0.68)] top-0 w-[390px]" />
      <div className="-translate-x-1/2 absolute h-[86px] left-[calc(50%+0.5px)] top-[97px] w-[141px]" data-name="Logo (1) 1">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLogo11} />
      </div>
      <Frame3 />
      <Frame4 />
    </div>
  );
}