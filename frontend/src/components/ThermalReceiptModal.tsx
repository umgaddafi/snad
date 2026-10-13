import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  Copy,
  Check,
  ChefHat,
  Receipt,
  Settings2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ThermalOrderItem {
  id?: number;
  quantity: number;
  unit_price?: string | number;
  food?: {
    id?: number;
    name: string;
    price?: number;
  };
  customizations?: any;
}

export interface ThermalOrder {
  id?: number;
  order_number: string;
  status?: string;
  created_at: string;
  delivery_type?: string;
  table_number?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  subtotal?: string | number;
  discount_amount?: string | number;
  coupon_code?: string | null;
  tax?: string | number;
  delivery_fee?: string | number;
  total_amount?: string | number;
  payment_method?: string;
  payment_reference?: string | null;
  special_instructions?: string | null;
  user?: {
    id?: number;
    name?: string;
    phone?: string | null;
    email?: string;
  } | null;
  rider?: {
    id?: number;
    name?: string;
    phone?: string | null;
  } | null;
  address?: {
    campus_zone?: string;
    specific_location?: string;
    instructions?: string;
  } | null;
  payment?: {
    payment_method?: string;
    transaction_reference?: string;
    status?: string;
  } | null;
  items: ThermalOrderItem[];
}

interface ThermalReceiptModalProps {
  order: ThermalOrder | null;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'kitchen' | 'customer';
}

// Code 39 Barcode character pattern lookup (N = Narrow bar/space, W = Wide bar/space)
const CODE39_PATTERNS: Record<string, string> = {
  '0': 'NNNWWNWNN', '1': 'WNNWNNNNW', '2': 'NNWWNNNNW', '3': 'WNWWNNNNN',
  '4': 'NNNWWNNNW', '5': 'WNNWWNNNN', '6': 'NNWWWNNNN', '7': 'NNNWNNWNW',
  '8': 'WNNWNNWNN', '9': 'NNWWNNWNN', 'A': 'WNNNNWNNW', 'B': 'NNWNNWNNW',
  'C': 'WNWNNWNNN', 'D': 'NNNNWWNNW', 'E': 'WNNNWWNNN', 'F': 'NNWNWWNNN',
  'G': 'NNNNNWWNW', 'H': 'WNNNNWWNN', 'I': 'NNWNNWWNN', 'J': 'NNNNWWWNN',
  'K': 'WNNNNNNWW', 'L': 'NNWNNNNWW', 'M': 'WNWNNNNWN', 'N': 'NNNNWNNWW',
  'O': 'WNNNWNNWN', 'P': 'NNWNWNNWN', 'Q': 'NNNNNNWWW', 'R': 'WNNNNNWWN',
  'S': 'NNWNNNWWN', 'T': 'NNNNWNWWN', 'U': 'WWNNNNNNW', 'V': 'NWWNNNNNW',
  'W': 'WWWNNNNNN', 'X': 'NWNNWNNNW', 'Y': 'WWNNWNNNN', 'Z': 'NWWNWNNNN',
  '-': 'NWNNNNWNW', '.': 'WWNNNNWNN', ' ': 'NWNNWNNNN', '$': 'NWNWNWNNN',
  '/': 'NWNWNNNWN', '+': 'NWNNNWNWN', '%': 'NNNWNWNWN', '*': 'NWNNWNWNN',
};

/**
 * Pure SVG Code 39 Barcode Component
 * Generates crisp 100% black/white bars suitable for thermal printers with zero external dependencies.
 */
function Code39Barcode({ value, height = 36 }: { value: string; height?: number }) {
  const sanitized = value.toUpperCase().replace(/[^0-9A-Z\-.$/+% ]/g, '');
  const fullString = `*${sanitized}*`;

  const narrowWidth = 1.6;
  const wideWidth = 3.8;
  const charSpacing = 2.0;

  let currentX = 2;
  const rects: React.ReactNode[] = [];

  for (let i = 0; i < fullString.length; i++) {
    const char = fullString[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

    for (let p = 0; p < 9; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === 'W';
      const width = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        rects.push(
          <rect
            key={`${i}-${p}`}
            x={currentX}
            y={0}
            width={width}
            height={height}
            fill="#000000"
          />
        );
      }
      currentX += width;
    }
    currentX += charSpacing;
  }

  const totalWidth = currentX + 2;

  return (
    <div className="flex flex-col items-center my-1">
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        width="100%"
        height={height}
        className="max-h-10 mx-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {rects}
      </svg>
      <span className="text-[10px] font-mono tracking-widest text-black mt-0.5 select-all">
        *{sanitized}*
      </span>
    </div>
  );
}

export default function ThermalReceiptModal({
  order,
  isOpen,
  onClose,
  initialMode = 'customer',
}: ThermalReceiptModalProps) {
  const [mode, setMode] = useState<'kitchen' | 'customer'>(initialMode);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [autoPrint, setAutoPrint] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('snad_thermal_paper_width');
    if (savedWidth === '58mm' || savedWidth === '80mm') {
      setPaperWidth(savedWidth);
    }
    const savedAutoPrint = localStorage.getItem('snad_thermal_auto_print');
    if (savedAutoPrint === 'true') {
      setAutoPrint(true);
    }
  }, []);

  // Update mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Set CSS custom property on the receipt element for width
  useEffect(() => {
    if (receiptRef.current) {
      receiptRef.current.style.setProperty('--receipt-paper-width', paperWidth);
    }
  }, [paperWidth, isOpen]);

  // Handle auto-print if enabled
  useEffect(() => {
    if (isOpen && autoPrint && order) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, order]);

  if (!isOpen || !order) return null;

  const handleWidthChange = (w: '58mm' | '80mm') => {
    setPaperWidth(w);
    localStorage.setItem('snad_thermal_paper_width', w);
  };

  const handleAutoPrintToggle = (checked: boolean) => {
    setAutoPrint(checked);
    localStorage.setItem('snad_thermal_auto_print', checked ? 'true' : 'false');
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error('Print error:', e);
      toast.error('Unable to initiate print dialog.');
    }
  };

  // Helper formatting
  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const subtotalNum =
    Number(order.subtotal) ||
    order.items.reduce((sum, item) => {
      const p = item.unit_price ? Number(item.unit_price) : item.food?.price || 0;
      return sum + p * item.quantity;
    }, 0);

  const discountNum = Number(order.discount_amount || 0);
  const deliveryFeeNum = Number(order.delivery_fee || 0);
  const grandTotalNum = Number(order.total_amount || subtotalNum - discountNum + deliveryFeeNum);

  const rawMethod = (order.payment_method || order.payment?.payment_method || 'cod').toLowerCase();
  let paymentMethodLabel = 'CASH';
  if (rawMethod.includes('paystack')) {
    paymentMethodLabel = 'PAID ONLINE (PAYSTACK)';
  } else if (rawMethod.includes('pos') || rawMethod.includes('card')) {
    paymentMethodLabel = 'PAID VIA POS CARD';
  } else if (rawMethod.includes('transfer')) {
    paymentMethodLabel = 'PAID VIA BANK TRANSFER';
  } else if (rawMethod.includes('cod') || rawMethod.includes('cash')) {
    paymentMethodLabel = order.delivery_type === 'delivery' ? 'CASH ON DELIVERY' : 'CASH (COUNTER SETTLED)';
  }

  const orderTypeLabel =
    order.delivery_type === 'dine_in'
      ? `DINE-IN ${order.table_number ? `(TABLE #${order.table_number})` : ''}`
      : (order.delivery_type || 'TAKEOUT').toUpperCase();

  const customerName = order.customer_name || order.user?.name || 'Walk-in Customer';
  const customerPhone = order.customer_phone || order.user?.phone || null;

  const paymentRef =
    order.payment_reference || order.payment?.transaction_reference || 'REF-' + order.order_number;

  // Format textual copy receipt for clipboard / SMS / WhatsApp / raw Bluetooth printing
  const handleCopyText = () => {
    let text = '';
    const line = paperWidth === '58mm' ? '--------------------------------' : '------------------------------------------------';
    const doubleLine = paperWidth === '58mm' ? '================================' : '================================================';

    if (mode === 'kitchen') {
      text += `*** KITCHEN ORDER TICKET ***\n`;
      text += `ORDER: ${order.order_number}\n`;
      text += `DATE:  ${formattedDate} ${formattedTime}\n`;
      text += `TYPE:  ${orderTypeLabel}\n`;
      text += `CUST:  ${customerName} (${customerPhone || 'N/A'})\n`;
      text += `${line}\n`;
      text += `ITEMS:\n`;
      order.items.forEach((item) => {
        text += `[${item.quantity}x] ${item.food?.name || 'Item'}\n`;
        const customizations = Array.isArray(item.customizations)
          ? item.customizations
          : item.customizations
          ? [String(item.customizations)]
          : [];
        if (customizations.length > 0) {
          text += `     + ${customizations.join(', ')}\n`;
        }
      });
      if (order.special_instructions) {
        text += `${line}\n`;
        text += `CHEF NOTE: ${order.special_instructions}\n`;
      }
      text += `${line}\n`;
      text += `STATUS: ${paymentMethodLabel}\n`;
    } else {
      text += `SNAD KITCHEN\nCampus Fast Dining & Treats\nTel: +234 800 000 0000\n`;
      text += `${doubleLine}\n`;
      text += `RECEIPT: ${order.order_number}\n`;
      text += `DATE:    ${formattedDate} ${formattedTime}\n`;
      text += `TYPE:    ${orderTypeLabel}\n`;
      text += `CLIENT:  ${customerName}\n`;
      if (customerPhone) text += `TEL:     ${customerPhone}\n`;
      if (order.address?.specific_location) {
        text += `ADDR:    ${order.address.campus_zone || ''} ${order.address.specific_location}\n`;
      }
      text += `${line}\n`;
      order.items.forEach((item) => {
        const itemPrice = item.unit_price ? Number(item.unit_price) : item.food?.price || 0;
        text += `${item.quantity}x ${item.food?.name || 'Item'} - ₦${(itemPrice * item.quantity).toLocaleString()}\n`;
      });
      text += `${line}\n`;
      text += `SUBTOTAL:     ₦${subtotalNum.toLocaleString()}\n`;
      if (discountNum > 0) text += `DISCOUNT:    -₦${discountNum.toLocaleString()}\n`;
      if (deliveryFeeNum > 0) text += `DELIVERY:     ₦${deliveryFeeNum.toLocaleString()}\n`;
      text += `${doubleLine}\n`;
      text += `TOTAL:        ₦${grandTotalNum.toLocaleString()}\n`;
      text += `${doubleLine}\n`;
      text += `PAYMENT: ${paymentMethodLabel}\n`;
      text += `REF: ${paymentRef}\n\n`;
      text += `Thank you for choosing Snad Kitchen!\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Thermal receipt text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const is58 = paperWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:block">
      {/* Background click overlay */}
      <div className="fixed inset-0 print:hidden" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="relative bg-neutral-900 border border-neutral-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:w-full print:static">
        {/* Modal Top Control Bar (Screen only) */}
        <div className="px-5 py-4 bg-neutral-800 border-b border-neutral-700 flex flex-wrap items-center justify-between gap-3 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Thermal POS Printer</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Option 1 Native
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Order #{order.order_number} • Direct ESC/POS thermal formatting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTips(!showTips)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                showTips
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
              title="Thermal Printer Setup Guide"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Print Tips</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Toolbar: Mode selector & Roll width toggle (Screen only) */}
        <div className="px-5 py-3 bg-neutral-850 border-b border-neutral-700/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
          {/* Mode Switcher */}
          <div className="flex items-center bg-neutral-900 p-1 rounded-2xl border border-neutral-700">
            <button
              onClick={() => setMode('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                mode === 'customer'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Customer Receipt</span>
            </button>
            <button
              onClick={() => setMode('kitchen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                mode === 'kitchen'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen Ticket (KOT)</span>
            </button>
          </div>

          {/* Paper Roll Width Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5" />
              Roll:
            </span>
            <div className="flex items-center bg-neutral-900 p-1 rounded-2xl border border-neutral-700">
              <button
                onClick={() => handleWidthChange('58mm')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  paperWidth === '58mm'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="58mm (2-inch) Portable Bluetooth POS"
              >
                58mm (2")
              </button>
              <button
                onClick={() => handleWidthChange('80mm')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  paperWidth === '80mm'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="80mm (3-inch) Standard POS Counter Printer"
              >
                80mm (3")
              </button>
            </div>
          </div>
        </div>

        {/* Helpful Tips Accordion (Screen only) */}
        {showTips && (
          <div className="bg-orange-950/40 border-b border-orange-500/30 px-5 py-3 text-xs text-orange-200 print:hidden space-y-1 animate-in fade-in duration-150">
            <p className="font-bold flex items-center gap-1.5 text-orange-300">
              <Info className="w-4 h-4 text-orange-400" />
              How to get flawless thermal prints in your browser:
            </p>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-orange-200/90 pl-1">
              <li>
                <strong>Destination:</strong> Select your thermal printer (e.g. POS-58, POS-80, Xprinter, Epson, Sunmi).
              </li>
              <li>
                <strong>Margins:</strong> Set to <strong>None</strong> or <strong>Minimum</strong> in the Chrome/Edge print dialog to avoid unwanted top blank paper.
              </li>
              <li>
                <strong>Headers & Footers:</strong> Uncheck "Headers and footers" to hide browser URLs and dates.
              </li>
              <li>
                <strong>Paper Size:</strong> Choose <strong>58mm Roll</strong> or <strong>80mm Roll</strong> (or "Continuous Receipt").
              </li>
            </ul>
          </div>
        )}

        {/* Receipt Preview Area (Scrollable counter simulation) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950/80 flex justify-center items-start print:overflow-visible print:p-0 print:bg-white print:m-0 print:block">
          {/*
            Realistic Physical Thermal Paper Roll
            Uses #thermal-printable-receipt for isolated CSS @media print
          */}
          <div
            id="thermal-printable-receipt"
            ref={receiptRef}
            style={{
              width: paperWidth,
              maxWidth: paperWidth,
              fontFamily: "'Courier New', Courier, monospace",
            }}
            className="bg-white text-black text-[12px] leading-tight select-text transition-all duration-200 relative shadow-2xl rounded-sm p-3.5 print:shadow-none print:p-1 print:m-0 print:border-none print:w-full"
          >
            {/* Top Serrated Tear Border Effect (Screen only) */}
            <div className="w-full border-b border-dashed border-gray-400 mb-2 pb-1 text-center text-[9px] text-gray-500 uppercase tracking-widest print:hidden">
              - - - TEAR HERE - - -
            </div>

            {/* ===============================================================
                RECEIPT MODE 1: KITCHEN ORDER TICKET (KOT)
               =============================================================== */}
            {mode === 'kitchen' && (
              <div className="space-y-2">
                {/* Header */}
                <div className="text-center border-b-2 border-dashed border-black pb-2">
                  <p className="text-[11px] font-black uppercase tracking-wider">
                    *** KITCHEN ORDER TICKET ***
                  </p>
                  <p className="text-[18px] sm:text-[20px] font-black tracking-tight leading-none mt-1">
                    #{order.order_number}
                  </p>
                  <div className="mt-1 inline-block border-2 border-black px-2 py-0.5 text-[11px] font-black uppercase">
                    {orderTypeLabel}
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-[11px] border-b border-dashed border-black pb-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span className="font-bold">{formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TIME:</span>
                    <span className="font-bold">{formattedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CUST:</span>
                    <span className="font-bold">{customerName}</span>
                  </div>
                  {customerPhone && (
                    <div className="flex justify-between">
                      <span>PHONE:</span>
                      <span>{customerPhone}</span>
                    </div>
                  )}
                  {order.rider?.name && (
                    <div className="flex justify-between">
                      <span>RIDER:</span>
                      <span className="font-bold">{order.rider.name}</span>
                    </div>
                  )}
                </div>

                {/* Items Section */}
                <div className="border-b-2 border-dashed border-black pb-2">
                  <div className="flex justify-between font-black text-[11px] border-b border-black pb-1 mb-1">
                    <span>QTY & ITEM</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {order.items.map((item, idx) => {
                      const customizations = Array.isArray(item.customizations)
                        ? item.customizations
                        : item.customizations
                        ? [String(item.customizations)]
                        : [];

                      return (
                        <div key={idx} className="leading-snug">
                          <div className="flex items-start justify-between">
                            <span className="font-black text-[13px] tracking-tight">
                              {item.quantity}x {item.food?.name || 'Item'}
                            </span>
                          </div>
                          {customizations.length > 0 && (
                            <div className="pl-3 text-[10px] text-neutral-800 font-semibold">
                              {customizations.map((c, cIdx) => (
                                <p key={cIdx}>• {c}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Special Instructions (Chef Note) */}
                {order.special_instructions && (
                  <div className="border-2 border-black p-2 my-1 text-[11px] bg-neutral-50 print:bg-white">
                    <p className="font-black uppercase tracking-wide underline">
                      *** CHEF INSTRUCTIONS ***
                    </p>
                    <p className="font-bold mt-1 text-[12px] italic">
                      "{order.special_instructions}"
                    </p>
                  </div>
                )}

                {/* Footer status */}
                <div className="text-center pt-1 text-[10px] space-y-1">
                  <p className="font-black">
                    TOTAL ITEMS: {order.items.reduce((s, i) => s + i.quantity, 0)}
                  </p>
                  <p className="font-bold border-t border-dashed border-black pt-1">
                    STATUS: {paymentMethodLabel}
                  </p>
                  <p className="text-[9px] text-neutral-600 mt-2">
                    - - - END OF KITCHEN TICKET - - -
                  </p>
                </div>
              </div>
            )}

            {/* ===============================================================
                RECEIPT MODE 2: CUSTOMER SALES RECEIPT
               =============================================================== */}
            {mode === 'customer' && (
              <div className="space-y-2">
                {/* Store Branding Header */}
                <div className="text-center border-b-2 border-dashed border-black pb-2 space-y-0.5">
                  <h1 className="text-[17px] font-black tracking-wider uppercase">
                    SNAD KITCHEN
                  </h1>
                  <p className="text-[10px] uppercase font-bold tracking-tight">
                    Fresh Campus Delights & Fast Bites
                  </p>
                  <p className="text-[9px]">Campus Main Branch, Student Hub</p>
                  <p className="text-[9px]">TEL: +234 800 000 0000</p>
                </div>

                {/* Receipt Metadata */}
                <div className="text-[10px] border-b border-dashed border-black pb-1.5 space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>RECEIPT NO:</span>
                    <span>{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE & TIME:</span>
                    <span>{formattedDate} {formattedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ORDER TYPE:</span>
                    <span className="font-bold uppercase">
                      {orderTypeLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="font-bold">{customerName}</span>
                  </div>
                  {customerPhone && (
                    <div className="flex justify-between">
                      <span>PHONE:</span>
                      <span>{customerPhone}</span>
                    </div>
                  )}
                  {order.address?.specific_location && (
                    <div className="pt-0.5">
                      <span className="font-bold">DELIVERY ADDR:</span>
                      <p className="text-[9px] leading-tight mt-0.5">
                        {order.address.campus_zone ? `${order.address.campus_zone}, ` : ''}
                        {order.address.specific_location}
                      </p>
                    </div>
                  )}
                </div>

                {/* Itemized Table */}
                <div className="border-b border-dashed border-black pb-2">
                  <div className="flex justify-between font-black text-[10px] border-b border-black pb-1 mb-1">
                    <span className="w-1/2">ITEM</span>
                    <span className="w-1/6 text-center">QTY</span>
                    <span className="w-1/3 text-right">AMOUNT</span>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    {order.items.map((item, idx) => {
                      const itemPrice = item.unit_price
                        ? Number(item.unit_price)
                        : item.food?.price || 0;
                      const lineTotal = itemPrice * item.quantity;
                      const customizations = Array.isArray(item.customizations)
                        ? item.customizations
                        : item.customizations
                        ? [String(item.customizations)]
                        : [];

                      return (
                        <div key={idx} className="text-[11px] leading-tight">
                          <div className="flex justify-between items-start">
                            <span className="w-1/2 font-bold break-words">
                              {item.food?.name || 'Item'}
                            </span>
                            <span className="w-1/6 text-center">{item.quantity}</span>
                            <span className="w-1/3 text-right font-bold">
                              ₦{lineTotal.toLocaleString()}
                            </span>
                          </div>
                          {customizations.length > 0 && (
                            <div className="text-[9px] text-neutral-600 pl-2">
                              + {customizations.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="text-[11px] space-y-1 border-b-2 border-dashed border-black pb-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₦{subtotalNum.toLocaleString()}</span>
                  </div>

                  {discountNum > 0 && (
                    <div className="flex justify-between text-neutral-800">
                      <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}:</span>
                      <span>-₦{discountNum.toLocaleString()}</span>
                    </div>
                  )}

                  {deliveryFeeNum > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₦{deliveryFeeNum.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex justify-between items-center text-[13px] sm:text-[14px] font-black border-t-2 border-black pt-1">
                    <span>GRAND TOTAL:</span>
                    <span>₦{grandTotalNum.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Verification */}
                <div className="text-[10px] border-b border-dashed border-black pb-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>PAYMENT:</span>
                    <span className="font-bold">{paymentMethodLabel}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span>TXN REF:</span>
                    <span className="font-mono">{paymentRef}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span>STATUS:</span>
                    <span className="font-bold uppercase text-black">CONFIRMED</span>
                  </div>
                </div>

                {/* Offline Code 39 Barcode */}
                <div className="text-center pt-1">
                  <Code39Barcode value={order.order_number} height={is58 ? 30 : 38} />
                </div>

                {/* Footer notes */}
                <div className="text-center text-[9px] pt-1 space-y-0.5">
                  <p className="font-bold">Thank you for dining with Snad Kitchen!</p>
                  <p>Fresh Ingredients • Campus Pride • Fast Service</p>
                  <p className="text-[8px] text-neutral-500 mt-1">
                    Keep this receipt for order verification & tracking.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Feed & Cut margin space for thermal roll cutter */}
            <div className="pt-4 text-center text-[8px] text-neutral-400 print:text-transparent">
              .
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar (Screen only) */}
        <div className="px-5 py-4 bg-neutral-850 border-t border-neutral-700 flex flex-wrap items-center justify-between gap-3 text-white print:hidden">
          {/* Left actions: auto print checkbox */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => handleAutoPrintToggle(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-neutral-900 border-neutral-700"
              />
              <span>Auto-print on open</span>
            </label>
          </div>

          {/* Right actions: Copy text & Print trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-xs font-bold text-neutral-200 transition"
              title="Copy receipt as formatted text (WhatsApp/SMS/Raw Bluetooth)"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print {mode === 'kitchen' ? 'Kitchen Ticket' : 'Receipt'} ({paperWidth})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
