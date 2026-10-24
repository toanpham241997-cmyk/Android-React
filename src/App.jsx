import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, Bell, Check, CheckCircle2, ChevronRight, CircleHelp,
  CirclePower, Crosshair, ExternalLink, Gamepad2, Gauge, Layers, LayoutGrid,
  LockKeyhole, Menu, Move, Palette, Play, RotateCcw, Scan, Search, Settings2,
  Shield, ShieldCheck, SlidersHorizontal, Smartphone, Sparkles, Target, Zap,
  BatteryCharging, Cpu, Eye, EyeOff, X
} from 'lucide-react';
import RobotScene from './RobotScene.jsx';
import Reticle, { COLORS, PRESETS } from './Reticle.jsx';
import { native, isNative } from './native.js';

const DEFAULT_CONFIG = {
  type: 'precision', color: '#31F2EC', size: 92, opacity: .75, line: 2.5,
  offsetX: 0, offsetY: 0, glow: true
};
const TABS = [
  { id: 'home', label: 'Tổng quan', icon: LayoutGrid },
  { id: 'crosshair', label: 'Tâm ảo', icon: Crosshair },
  { id: 'games', label: 'Thư viện', icon: Gamepad2 },
  { id: 'settings', label: 'Cài đặt', icon: Settings2 },
];
function stored(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}
function humanRam(mb) { return Number.isFinite(mb) ? (mb / 1024).toFixed(1) + ' GB' : '--'; }

function SectionHead({ eyebrow, title, action, onAction }) {
  return <div className="section-head">
    <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
    {action && <button className="link-action" onClick={onAction}>{action}<ChevronRight size={15}/></button>}
  </div>;
}
function RangeRow({ icon: Icon, title, value, min, max, step = 1, suffix = '', onChange }) {
  return <div className="range-row">
    <div className="range-heading"><span className="range-label"><Icon size={17}/>{title}</span><strong>{value}{suffix}</strong></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/>
    <div className="range-extremes"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
  </div>;
}
function Switch({ value, onChange }) {
  return <button className={`switch ${value ? 'on' : ''}`} role="switch" aria-checked={value} onClick={() => onChange(!value)}><span/></button>;
}
function SettingRow({ icon: Icon, title, desc, right, onClick }) {
  const content = <><span className="setting-icon"><Icon size={18}/></span><span className="setting-copy"><strong>{title}</strong><small>{desc}</small></span>{right}</>;
  return onClick ? <button className="setting-row" onClick={onClick}>{content}</button> : <div className="setting-row">{content}</div>;
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [config, setConfig] = useState(() => ({ ...DEFAULT_CONFIG, ...stored('gc-crosshair', {}) }));
  const [status, setStatus] = useState(() => native.status());
  const [device, setDevice] = useState(() => native.device());
  const [apps, setApps] = useState([]);
  const [appsFetched, setAppsFetched] = useState(false);
  const [search, setSearch] = useState('');
  const [appsType, setAppsType] = useState('all');
  const [lite, setLite] = useState(() => stored('gc-lite', false));
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem('gc-crosshair', JSON.stringify(config)); native.update(config); }, [config]);
  useEffect(() => { localStorage.setItem('gc-lite', JSON.stringify(lite)); }, [lite]);
  useEffect(() => {
    const refresh = () => { setStatus(native.status()); setDevice(native.device()); };
    window.addEventListener('aujunpeak-native-update', refresh);
    const visibility = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', visibility);
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, 6000);
    return () => { window.removeEventListener('aujunpeak-native-update', refresh); document.removeEventListener('visibilitychange', visibility); clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (tab === 'games' && !appsFetched) {
      setApps(native.games());
      setAppsFetched(true);
    }
  }, [tab, appsFetched]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3300);
    return () => clearTimeout(timeout);
  }, [toast]);

  const changeConfig = (key, value) => setConfig(current => ({ ...current, [key]: value }));
  const popup = (message) => setToast({ key: Date.now(), message });
  const enableOverlay = () => {
    if (!isNative) return setModal('web');
    if (!native.status().permission) return setModal('permission');
    native.start(config);
    setTimeout(() => {
      const result = native.status();
      setStatus(result);
      popup(result.active ? 'Đã bật tâm ảo — hãy mở trò chơi.' : 'Không thể bật HUD. Hãy kiểm tra quyền và thông báo.');
    }, 750);
  };
  const disableOverlay = () => {
    native.stop();
    setStatus(current => ({ ...current, active: false }));
    popup('Đã tắt tâm ảo.');
  };
  const filteredApps = useMemo(() => apps.filter(app =>
    (appsType !== 'game' || app.game) &&
    (app.name + ' ' + app.packageName).toLowerCase().includes(search.toLowerCase())
  ), [apps, appsType, search]);

  return <div className={`app-shell ${lite ? 'lite' : ''}`}>
    <div className="grain" aria-hidden="true"/>
    <div className="top-halo" aria-hidden="true"/>
    <header className="app-header">
      <div className="brand-lockup"><div className="brand-symbol"><span>Δ</span></div><div>
        <div className="brand-name">AUJUN<span>PEAK</span></div>
        <div className="brand-sub">G A M E C O R E <span className="brand-version">/ 1.0</span></div>
      </div></div>
      <button className="header-status" onClick={() => setModal('about')} aria-label="Trạng thái hệ thống">
        <span className="live-dot"/><span>SYSTEM <b>ONLINE</b></span>
      </button>
    </header>

    <main className="scroll-area" key={tab}>
      {tab === 'home' && <div className="page home-page">
        <div className="intro-row"><div><span className="tiny-kicker"><span className="line-segment"/> CONTROL CENTER</span><h1>Game mode<span className="cyan-period">.</span></h1><p>Trung tâm điều khiển tối ưu trải nghiệm gaming.</p></div><div className="decor-small">01<span>/04</span></div></div>
        <section className="hero-panel">
          <div className="hero-grid"/>
          <div className="hero-top"><span><span className="hero-pulse"/> NEURAL CORE ACTIVE</span><span>V.01 / AI-UNIT</span></div>
          <RobotScene lite={lite}/>
          <div className="hero-orbit-label hero-label-left"><div className="label-track"/> SYS.01 <span>STABLE</span></div>
          <div className="hero-orbit-label hero-label-right">ENGINE <span>READY</span></div>
          <div className="hero-bottom">
            <div><div className="hero-name">A U J U N <span>O S</span></div><div className="hero-description">ROBOTIC GAMING INTERFACE</div></div>
            <div className="hero-badge">AI <b>CORE</b></div>
          </div>
        </section>
        <section className="control-panel">
          <div className="control-top"><div className="control-icon"><Crosshair size={22}/></div><div className="control-copy"><h3>Crosshair Overlay</h3><p>Hiển thị tâm ngắm trên ứng dụng khác</p></div><span className={`state-chip ${status.active ? 'active' : ''}`}>{status.active ? 'ĐANG BẬT' : 'SẴN SÀNG'}</span></div>
          <div className="crosshair-mini-line"><div className="target-small"><Reticle type={config.type} color={config.color} size={43} glow={config.glow}/></div><div><strong>{PRESETS.find(p => p.id === config.type)?.label}</strong><span>Preset hiện tại · {config.size}dp</span></div><button onClick={() => setTab('crosshair')} aria-label="Chỉnh tâm ngắm"><SlidersHorizontal size={18}/></button></div>
          <button className={`primary-button ${status.active ? 'stop-btn' : ''}`} onClick={status.active ? disableOverlay : enableOverlay}><CirclePower size={19}/>{status.active ? 'TẮT TÂM NGẮM' : 'KÍCH HOẠT TÂM NGẮM'}<ChevronRight size={18}/></button>
          {!isNative && <span className="web-note">Bản xem trước trên trình duyệt — cần APK Android để dùng tâm nổi.</span>}
        </section>
        <SectionHead eyebrow="01 / DEVICE TELEMETRY" title="Thiết bị của bạn"/>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-top"><BatteryCharging size={19}/><span>BATTERY</span></div><strong>{device.battery == null ? '--' : `${device.battery}%`}</strong><div className="stat-bottom"><span>Pin thiết bị</span><span className="stat-bar"><i style={{ width: `${device.battery ?? 0}%` }}/></span></div></div>
          <div className="stat-card purple-stat"><div className="stat-top"><Cpu size={19}/><span>AVAILABLE RAM</span></div><strong>{humanRam(device.availableRamMB)}</strong><div className="stat-bottom"><span>Còn khả dụng</span><span className="stat-mini">/ {humanRam(device.totalRamMB)}</span></div></div>
        </div>
        <div className="quick-row"><div className="quick-icon"><Gamepad2 size={20}/></div><div><strong>Game launcher</strong><small>Khởi chạy game yêu thích</small></div><button onClick={() => setTab('games')}><ArrowDownRight size={19}/></button></div>
        <div className="bottom-wordmark">ENGINEERED FOR PLAY <span>✦</span> AUJUNPEAK VN</div>
      </div>}

      {tab === 'crosshair' && <div className="page hud-page">
        <div className="page-eyebrow"><span className="line-segment"/> MODULE 02 / VISUAL HUD</div><h1>Crosshair<span className="cyan-period">.</span></h1><p className="page-lead">Tuỳ chỉnh tâm ngắm nổi. Thay đổi được cập nhật trực tiếp khi HUD đang bật.</p>
        <div className="preview-panel"><div className="preview-top"><span><Scan size={15}/> LIVE PREVIEW</span><span className="preview-id">{config.type.toUpperCase()} / 01</span></div>
          <div className="preview-stage"><div className="preview-grid"/><div className="target-orbit orbit-one"/><div className="target-orbit orbit-two"/>
            <div className="center-ruler horizontal"/><div className="center-ruler vertical"/><div className="reticle-preview"><Reticle type={config.type} color={config.color} size={Math.min(154, config.size * 1.32)} line={config.line} glow={config.glow} opacity={Math.min(1,config.opacity / .78)}/></div>
          </div>
          <div className="preview-footer"><span><span className="live-dot"/> RENDER: LIVE</span><span>TOUCH THROUGH / ON</span></div>
        </div>
        <SectionHead eyebrow="01 / RETICLE STYLE" title="Kiểu tâm ngắm"/>
        <div className="presets-grid">{PRESETS.map(preset => <button key={preset.id} className={`preset ${config.type === preset.id ? 'selected' : ''}`} onClick={() => changeConfig('type', preset.id)}><div><Reticle type={preset.id} color={config.type === preset.id ? config.color : '#8793ab'} size={54} glow={config.type === preset.id}/></div><span>{preset.label}</span>{config.type === preset.id && <Check size={13} className="preset-check"/>}</button>)}</div>
        <SectionHead eyebrow="02 / COLOR ENGINE" title="Màu sắc ánh sáng"/>
        <div className="color-row">{COLORS.map(color => <button key={color} className={`color-choice ${config.color === color ? 'chosen' : ''}`} style={{ '--chosen-color': color }} onClick={() => changeConfig('color', color)} aria-label={`Chọn màu ${color}`}><span style={{ background: color }}>{config.color === color && <Check size={15} color="#07121d" strokeWidth={3}/>}</span></button>)}</div>
        <SectionHead eyebrow="03 / HUD CALIBRATION" title="Tinh chỉnh chi tiết"/>
        <div className="sliders-panel">
          <RangeRow icon={Target} title="Kích thước" value={config.size} min={42} max={160} suffix=" dp" onChange={v => changeConfig('size', v)}/>
          <RangeRow icon={Eye} title="Độ hiển thị" value={Math.round(config.opacity * 100)} min={20} max={78} suffix="%" onChange={v => changeConfig('opacity', v / 100)}/>
          <RangeRow icon={Layers} title="Độ dày đường" value={config.line} min={1} max={5} step={.5} onChange={v => changeConfig('line', v)}/>
          <RangeRow icon={Move} title="Vị trí ngang" value={config.offsetX} min={-45} max={45} suffix="%" onChange={v => changeConfig('offsetX', v)}/>
          <RangeRow icon={Move} title="Vị trí dọc" value={config.offsetY} min={-42} max={42} suffix="%" onChange={v => changeConfig('offsetY', v)}/>
          <div className="toggle-glow"><div><Sparkles size={17}/><span>Neon glow</span></div><Switch value={config.glow} onChange={v => changeConfig('glow', v)}/></div>
          <button className="reset-button" onClick={() => {setConfig(DEFAULT_CONFIG);popup('Đã khôi phục cấu hình mặc định.');}}><RotateCcw size={15}/> Khôi phục mặc định</button>
        </div>
        <button className={`primary-button sticky-cta ${status.active ? 'stop-btn' : ''}`} onClick={status.active ? disableOverlay : enableOverlay}><CirclePower size={19}/>{status.active ? 'TẮT HUD ĐANG HOẠT ĐỘNG' : 'HIỂN THỊ TÂM TRÊN GAME'}<ChevronRight size={18}/></button>
      </div>}

      {tab === 'games' && <div className="page game-page">
        <div className="page-eyebrow"><span className="line-segment"/> MODULE 03 / GAME LIBRARY</div><h1>Game library<span className="cyan-period">.</span></h1><p className="page-lead">Mở ứng dụng đã cài trên thiết bị. Tâm ảo vẫn hiển thị sau khi vào game.</p>
        <div className="games-banner"><div className="game-banner-icon"><Gamepad2 size={27}/></div><div><span>QUICK LAUNCH SYSTEM</span><strong>{isNative ? `${apps.length} ứng dụng sẵn sàng` : 'Android game center'}</strong></div><div className="banner-mark">//</div></div>
        <div className="search-box"><Search size={18}/><input value={search} placeholder="Tìm trò chơi hoặc ứng dụng..." onChange={e => setSearch(e.target.value)}/>{search && <button onClick={() => setSearch('')} aria-label="Xóa tìm kiếm"><X size={16}/></button>}</div>
        <div className="filter-tabs"><button className={appsType === 'all' ? 'selected' : ''} onClick={() => setAppsType('all')}>Tất cả</button><button className={appsType === 'game' ? 'selected' : ''} onClick={() => setAppsType('game')}>Trò chơi</button><span>{filteredApps.length} mục</span></div>
        {!isNative ? <div className="empty-state"><Smartphone size={34}/><strong>Thư viện trên điện thoại</strong><p>Danh sách ứng dụng sẽ được đọc từ Android sau khi bạn cài APK.</p></div> : filteredApps.length === 0 ? <div className="empty-state"><Gamepad2 size={34}/><strong>Không có ứng dụng phù hợp</strong><p>Hãy thử tìm kiếm khác hoặc chuyển sang “Tất cả”.</p><button onClick={() => { setApps(native.games()); setAppsFetched(true); }}>Làm mới danh sách</button></div> : <div className="app-list">{filteredApps.map(app => <div key={app.packageName} className="game-row"><div className="app-art">{app.icon ? <img src={app.icon} alt=""/> : <Gamepad2 size={23}/>}</div><div className="game-copy"><strong>{app.name}</strong><small>{app.game ? 'GAME DETECTED' : 'ỨNG DỤNG'} · {app.packageName}</small></div><button className="launch-button" aria-label={`Mở ${app.name}`} onClick={() => native.launch(app.packageName)}><Play fill="currentColor" size={17}/></button></div>)}</div>}
        <div className="game-tip"><ShieldCheck size={19}/><p>Tâm ngắm chỉ là lớp phủ trực quan, không sửa file game, không can thiệp bộ nhớ hoặc tự động điều khiển tâm.</p></div>
      </div>}

      {tab === 'settings' && <div className="page settings-page">
        <div className="page-eyebrow"><span className="line-segment"/> MODULE 04 / SYSTEM OPTIONS</div><h1>Settings<span className="cyan-period">.</span></h1><p className="page-lead">Cấp quyền, thay đổi hiệu ứng và kiểm soát hoạt động của HUD.</p>
        <SectionHead eyebrow="01 / PERMISSIONS" title="Quyền Android"/>
        <div className="settings-panel">
          <SettingRow icon={status.permission ? ShieldCheck : LockKeyhole} title="Hiển thị trên ứng dụng khác" desc={status.permission ? 'Đã cấp quyền hiển thị tâm ảo' : 'Bắt buộc để tâm nổi trên game'} right={<span className={`permission-status ${status.permission ? 'granted' : ''}`}>{status.permission ? 'ĐÃ CẤP' : 'CHƯA CẤP'}</span>} onClick={() => !status.permission ? setModal('permission') : popup('Quyền lớp phủ đã được cấp.')}/>
          <SettingRow icon={Bell} title="Thông báo điều khiển" desc="Dừng tâm ảo ngay từ thanh thông báo" right={<ChevronRight size={18}/>} onClick={() => isNative ? native.openAppSettings() : setModal('web')}/>
          <SettingRow icon={Shield} title="Trạng thái HUD" desc={status.active ? 'Dịch vụ tâm ảo đang chạy' : 'Dịch vụ tâm ảo đã tắt'} right={<span className={`small-state ${status.active ? 'on' : ''}`}>{status.active ? 'ON' : 'OFF'}</span>}/>
        </div>
        <SectionHead eyebrow="02 / GRAPHICS" title="Hiệu ứng giao diện"/>
        <div className="settings-panel"><SettingRow icon={Gauge} title="Chế độ nhẹ" desc="Giảm hiệu ứng robot 3D để tiết kiệm pin" right={<Switch value={lite} onChange={setLite}/>}/><SettingRow icon={Palette} title="Bộ màu HUD" desc="Tùy chỉnh tại mục Tâm ảo" right={<ChevronRight size={18}/>} onClick={() => setTab('crosshair')}/></div>
        <SectionHead eyebrow="03 / INFORMATION" title="Hệ thống"/>
        <div className="device-details"><div><span>DEVICE</span><strong>{device.model || 'Không xác định'}</strong></div><div><span>ANDROID</span><strong>{device.androidVersion || '--'}</strong></div><div><span>BUILD</span><strong>1.0.0 / DEBUG</strong></div><div><span>OVERLAY ENGINE</span><strong>ANDROID NATIVE</strong></div></div>
        <div className="privacy-note"><ShieldCheck size={17}/><span>Ứng dụng không yêu cầu root và không tải dữ liệu trò chơi lên máy chủ.</span></div>
        <div className="bottom-wordmark">AUJUNPEAK VN <span>✦</span> GAMECORE V1.0</div>
      </div>}
    </main>

    <nav className="bottom-nav" aria-label="Điều hướng chính">{TABS.map(item => <button key={item.id} className={`nav-item ${tab === item.id ? 'current' : ''}`} onClick={() => setTab(item.id)}><item.icon size={21} strokeWidth={tab === item.id ? 2.2 : 1.8}/><span>{item.label}</span>{tab === item.id && <i/>}</button>)}</nav>

    {toast && <div className="toast-message" key={toast.key}><CheckCircle2 size={17}/>{toast.message}</div>}
    {modal && <div className="modal-backdrop" onClick={() => setModal(null)}><div className="modal-content" onClick={event => event.stopPropagation()}><button className="modal-close" aria-label="Đóng" onClick={() => setModal(null)}><X size={20}/></button><div className="modal-symbol"><ShieldCheck size={26}/></div>
      {modal === 'permission' ? <><span className="modal-eyebrow">ANDROID PERMISSION</span><h3>Cấp quyền hiển thị nổi</h3><p>Để tâm ảo xuất hiện trên trò chơi khác, Android yêu cầu bạn tự cấp quyền <b>Hiển thị trên ứng dụng khác</b> cho AUJUNPEAK GameCore.</p><div className="modal-steps"><span>01</span> Mở cài đặt quyền Android<br/><span>02</span> Bật <b>Cho phép hiển thị trên ứng dụng khác</b><br/><span>03</span> Quay lại app và bấm kích hoạt</div><button className="primary-button" onClick={() => { setModal(null); native.requestPermission(); }}><ExternalLink size={17}/> MỞ CÀI ĐẶT QUYỀN</button></> : modal === 'web' ? <><span className="modal-eyebrow">PREVIEW MODE</span><h3>Chạy trên Android để dùng HUD</h3><p>Đây là giao diện demo React trên trình duyệt. Để có tâm ảo thật trên các trò chơi khác, hãy build APK bằng GitHub Actions và cài lên điện thoại Android.</p><button className="primary-button" onClick={() => setModal(null)}>ĐÃ HIỂU <ChevronRight size={18}/></button></> : <><span className="modal-eyebrow">ABOUT GAMECORE</span><h3>AUJUNPEAK GameCore</h3><p>Ứng dụng React với robot 3D và hệ thống tâm ảo Android native. Chức năng tâm ảo cần quyền Android và có thể bị một số game hoặc thiết bị chặn.</p><button className="primary-button" onClick={() => setModal(null)}>ĐÓNG <Check size={18}/></button></>}
    </div></div>}
  </div>;
}
