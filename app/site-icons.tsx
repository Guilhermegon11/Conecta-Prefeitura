import { forwardRef, type ComponentType, type SVGProps } from "react";

import {
  Accessibility as AccessibilityGlyph,
  Activity as ActivityGlyph,
  AlertTriangle as AlertTriangleGlyph,
  Archive as ArchiveGlyph,
  BarChart3 as BarChart3Glyph,
  Bell as BellGlyph,
  BellRing as BellRingGlyph,
  BookOpen as BookOpenGlyph,
  BookOpenCheck as BookOpenCheckGlyph,
  Bot as BotGlyph,
  BriefcaseBusiness as BriefcaseBusinessGlyph,
  Building2 as Building2Glyph,
  CalendarClock as CalendarClockGlyph,
  CalendarDays as CalendarDaysGlyph,
  CalendarPlus as CalendarPlusGlyph,
  CheckCircle2 as CheckCircle2Glyph,
  CircleAlert as CircleAlertGlyph,
  CircleDollarSign as CircleDollarSignGlyph,
  ClipboardCheck as ClipboardCheckGlyph,
  ClipboardList as ClipboardListGlyph,
  Clock3 as Clock3Glyph,
  Cloud as CloudGlyph,
  Crown as CrownGlyph,
  Database as DatabaseGlyph,
  FileBadge as FileBadgeGlyph,
  FileCheck2 as FileCheck2Glyph,
  FileClock as FileClockGlyph,
  FilePlus2 as FilePlus2Glyph,
  FileSearch as FileSearchGlyph,
  FileSignature as FileSignatureGlyph,
  FileText as FileTextGlyph,
  Files as FilesGlyph,
  Filter as FilterGlyph,
  Gauge as GaugeGlyph,
  HardHat as HardHatGlyph,
  HeartHandshake as HeartHandshakeGlyph,
  HelpCircle as HelpCircleGlyph,
  History as HistoryGlyph,
  Home as HomeGlyph,
  Inbox as InboxGlyph,
  KeyRound as KeyRoundGlyph,
  Landmark as LandmarkGlyph,
  Layers3 as Layers3Glyph,
  LayoutDashboard as LayoutDashboardGlyph,
  List as ListGlyph,
  ListChecks as ListChecksGlyph,
  ListTodo as ListTodoGlyph,
  LoaderCircle as LoaderCircleGlyph,
  LocateFixed as LocateFixedGlyph,
  LockKeyhole as LockKeyholeGlyph,
  Mail as MailGlyph,
  Map as MapGlyph,
  MapPin as MapPinGlyph,
  MessageSquare as MessageSquareGlyph,
  MessageSquarePlus as MessageSquarePlusGlyph,
  MessageSquareText as MessageSquareTextGlyph,
  MessagesSquare as MessagesSquareGlyph,
  Network as NetworkGlyph,
  Newspaper as NewspaperGlyph,
  NotebookPen as NotebookPenGlyph,
  PanelsTopLeft as PanelsTopLeftGlyph,
  Paperclip as PaperclipGlyph,
  Pencil as PencilGlyph,
  PencilLine as PencilLineGlyph,
  Phone as PhoneGlyph,
  QrCode as QrCodeGlyph,
  RefreshCcw as RefreshCcwGlyph,
  RefreshCw as RefreshCwGlyph,
  Rss as RssGlyph,
  Save as SaveGlyph,
  Search as SearchGlyph,
  Send as SendGlyph,
  ServerCog as ServerCogGlyph,
  Settings as SettingsGlyph,
  Settings2 as Settings2Glyph,
  ShieldCheck as ShieldCheckGlyph,
  SlidersHorizontal as SlidersHorizontalGlyph,
  Smartphone as SmartphoneGlyph,
  Sparkles as SparklesGlyph,
  Star as StarGlyph,
  Target as TargetGlyph,
  TimerReset as TimerResetGlyph,
  Trash2 as Trash2Glyph,
  TrendingUp as TrendingUpGlyph,
  Type as TypeGlyph,
  Upload as UploadGlyph,
  UserCheck as UserCheckGlyph,
  UserCog as UserCogGlyph,
  UserPlus as UserPlusGlyph,
  UserRound as UserRoundGlyph,
  UserRoundCheck as UserRoundCheckGlyph,
  UsersRound as UsersRoundGlyph,
  Warehouse as WarehouseGlyph,
  Workflow as WorkflowGlyph,
  Wrench as WrenchGlyph,
  Zap as ZapGlyph,
} from "lucide-react";

export {
  ArrowRight,
  ArrowUpRight,
  Bus,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
  ChevronDown,
  CircleDot,
  CloudOff,
  Contrast,
  Copy,
  Crosshair,
  Download,
  ExternalLink,
  Eye,
  Hash,
  LogIn,
  LogOut,
  Menu,
  Minus,
  MoreHorizontal,
  Navigation,
  Play,
  Plus,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";

export type SiteIconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
};

export type LucideIcon = ComponentType<SiteIconProps>;

const outlineGlyphs = {
  Accessibility: AccessibilityGlyph,
  Activity: ActivityGlyph,
  AlertTriangle: AlertTriangleGlyph,
  Archive: ArchiveGlyph,
  BarChart3: BarChart3Glyph,
  Bell: BellGlyph,
  BellRing: BellRingGlyph,
  BookOpen: BookOpenGlyph,
  BookOpenCheck: BookOpenCheckGlyph,
  Bot: BotGlyph,
  BriefcaseBusiness: BriefcaseBusinessGlyph,
  Building2: Building2Glyph,
  CalendarClock: CalendarClockGlyph,
  CalendarDays: CalendarDaysGlyph,
  CalendarPlus: CalendarPlusGlyph,
  CheckCircle2: CheckCircle2Glyph,
  CircleAlert: CircleAlertGlyph,
  CircleDollarSign: CircleDollarSignGlyph,
  ClipboardCheck: ClipboardCheckGlyph,
  ClipboardList: ClipboardListGlyph,
  Clock3: Clock3Glyph,
  Cloud: CloudGlyph,
  Crown: CrownGlyph,
  Database: DatabaseGlyph,
  FileBadge: FileBadgeGlyph,
  FileCheck2: FileCheck2Glyph,
  FileClock: FileClockGlyph,
  FilePlus2: FilePlus2Glyph,
  FileSearch: FileSearchGlyph,
  FileSignature: FileSignatureGlyph,
  FileText: FileTextGlyph,
  Files: FilesGlyph,
  Filter: FilterGlyph,
  Gauge: GaugeGlyph,
  HardHat: HardHatGlyph,
  HeartHandshake: HeartHandshakeGlyph,
  HelpCircle: HelpCircleGlyph,
  History: HistoryGlyph,
  Home: HomeGlyph,
  Inbox: InboxGlyph,
  KeyRound: KeyRoundGlyph,
  Landmark: LandmarkGlyph,
  Layers3: Layers3Glyph,
  LayoutDashboard: LayoutDashboardGlyph,
  List: ListGlyph,
  ListChecks: ListChecksGlyph,
  ListTodo: ListTodoGlyph,
  LoaderCircle: LoaderCircleGlyph,
  LocateFixed: LocateFixedGlyph,
  LockKeyhole: LockKeyholeGlyph,
  Mail: MailGlyph,
  Map: MapGlyph,
  MapPin: MapPinGlyph,
  MessageSquare: MessageSquareGlyph,
  MessageSquarePlus: MessageSquarePlusGlyph,
  MessageSquareText: MessageSquareTextGlyph,
  MessagesSquare: MessagesSquareGlyph,
  Network: NetworkGlyph,
  Newspaper: NewspaperGlyph,
  NotebookPen: NotebookPenGlyph,
  PanelsTopLeft: PanelsTopLeftGlyph,
  Paperclip: PaperclipGlyph,
  Pencil: PencilGlyph,
  PencilLine: PencilLineGlyph,
  Phone: PhoneGlyph,
  QrCode: QrCodeGlyph,
  RefreshCcw: RefreshCcwGlyph,
  RefreshCw: RefreshCwGlyph,
  Rss: RssGlyph,
  Save: SaveGlyph,
  Search: SearchGlyph,
  Send: SendGlyph,
  ServerCog: ServerCogGlyph,
  Settings: SettingsGlyph,
  Settings2: Settings2Glyph,
  ShieldCheck: ShieldCheckGlyph,
  SlidersHorizontal: SlidersHorizontalGlyph,
  Smartphone: SmartphoneGlyph,
  Sparkles: SparklesGlyph,
  Star: StarGlyph,
  Target: TargetGlyph,
  TimerReset: TimerResetGlyph,
  Trash2: Trash2Glyph,
  TrendingUp: TrendingUpGlyph,
  Type: TypeGlyph,
  Upload: UploadGlyph,
  UserCheck: UserCheckGlyph,
  UserCog: UserCogGlyph,
  UserPlus: UserPlusGlyph,
  UserRound: UserRoundGlyph,
  UserRoundCheck: UserRoundCheckGlyph,
  UsersRound: UsersRoundGlyph,
  Warehouse: WarehouseGlyph,
  Workflow: WorkflowGlyph,
  Wrench: WrenchGlyph,
  Zap: ZapGlyph,
};

function createBusinessIcon(asset: string, displayName: keyof typeof outlineGlyphs) {
  const Glyph = outlineGlyphs[displayName];
  const BusinessGlyph = forwardRef<SVGSVGElement, SiteIconProps>(function BusinessGlyph(
    { size = 24, strokeWidth = 1.8, ...props }, ref,
  ) {
    const accessible = Boolean(props["aria-label"]);
    return <Glyph {...props} ref={ref} size={size} strokeWidth={strokeWidth}
      role={props.role ?? (accessible ? "img" : undefined)}
      aria-hidden={props["aria-hidden"] ?? (accessible ? undefined : true)}
      focusable="false" data-business-icon={asset} data-icon-family="lucide" />;
  });
  BusinessGlyph.displayName = displayName;
  return BusinessGlyph;
}

export const Accessibility = createBusinessIcon("24-7-support", "Accessibility");
export const Activity = createBusinessIcon("monitoring", "Activity");
export const AlertTriangle = createBusinessIcon("deadline", "AlertTriangle");
export const Archive = createBusinessIcon("file-binder", "Archive");
export const BarChart3 = createBusinessIcon("bar-chart", "BarChart3");
export const Bell = createBusinessIcon("reminder", "Bell");
export const BellRing = createBusinessIcon("reminder", "BellRing");
export const BookOpen = createBusinessIcon("writing-book", "BookOpen");
export const BookOpenCheck = createBusinessIcon("service-book", "BookOpenCheck");
export const Bot = createBusinessIcon("ai-assistant", "Bot");
export const BriefcaseBusiness = createBusinessIcon("business-portfolio", "BriefcaseBusiness");
export const Building2 = createBusinessIcon("office-building", "Building2");
export const CalendarClock = createBusinessIcon("time-management", "CalendarClock");
export const CalendarDays = createBusinessIcon("schedule-planner", "CalendarDays");
export const CalendarPlus = createBusinessIcon("new-month", "CalendarPlus");
export const CheckCircle2 = createBusinessIcon("mission-accomplished", "CheckCircle2");
export const CircleAlert = createBusinessIcon("deadline", "CircleAlert");
export const CircleDollarSign = createBusinessIcon("financial-management", "CircleDollarSign");
export const ClipboardCheck = createBusinessIcon("verified-list", "ClipboardCheck");
export const ClipboardList = createBusinessIcon("checklist", "ClipboardList");
export const Clock3 = createBusinessIcon("stopwatch-time-counter", "Clock3");
export const Cloud = createBusinessIcon("cloud-configuration", "Cloud");
export const Crown = createBusinessIcon("leadership", "Crown");
export const Database = createBusinessIcon("file-drawer", "Database");
export const FileBadge = createBusinessIcon("verified-document", "FileBadge");
export const FileCheck2 = createBusinessIcon("approved-document", "FileCheck2");
export const FileClock = createBusinessIcon("deadline", "FileClock");
export const FilePlus2 = createBusinessIcon("document-paper", "FilePlus2");
export const FileSearch = createBusinessIcon("verified-search", "FileSearch");
export const FileSignature = createBusinessIcon("official-document", "FileSignature");
export const FileText = createBusinessIcon("document", "FileText");
export const Files = createBusinessIcon("file-folders", "Files");
export const Filter = createBusinessIcon("capital-filtration", "Filter");
export const Gauge = createBusinessIcon("efficiency", "Gauge");
export const HardHat = createBusinessIcon("technical-tools", "HardHat");
export const HeartHandshake = createBusinessIcon("business-meeting", "HeartHandshake");
export const HelpCircle = createBusinessIcon("24-7-support", "HelpCircle");
export const History = createBusinessIcon("time-flow", "History");
export const Home = createBusinessIcon("office-building", "Home");
export const Inbox = createBusinessIcon("mail-attachment", "Inbox");
export const KeyRound = createBusinessIcon("system-security", "KeyRound");
export const Landmark = createBusinessIcon("office-building", "Landmark");
export const Layers3 = createBusinessIcon("hierarchical-network", "Layers3");
export const LayoutDashboard = createBusinessIcon("analytics-board", "LayoutDashboard");
export const List = createBusinessIcon("checklist", "List");
export const ListChecks = createBusinessIcon("verified-list", "ListChecks");
export const ListTodo = createBusinessIcon("task-management", "ListTodo");
export const LoaderCircle = createBusinessIcon("preloader", "LoaderCircle");
export const LocateFixed = createBusinessIcon("target-location", "LocateFixed");
export const LockKeyhole = createBusinessIcon("system-security", "LockKeyhole");
export const Mail = createBusinessIcon("email", "Mail");
export const Map = createBusinessIcon("location-map", "Map");
export const MapPin = createBusinessIcon("target-location", "MapPin");
export const MessageSquare = createBusinessIcon("communication", "MessageSquare");
export const MessageSquarePlus = createBusinessIcon("communicator", "MessageSquarePlus");
export const MessageSquareText = createBusinessIcon("conversation", "MessageSquareText");
export const MessagesSquare = createBusinessIcon("web-chat", "MessagesSquare");
export const Network = createBusinessIcon("hierarchical-network", "Network");
export const Newspaper = createBusinessIcon("global-news", "Newspaper");
export const NotebookPen = createBusinessIcon("writing-book", "NotebookPen");
export const PanelsTopLeft = createBusinessIcon("web-layout", "PanelsTopLeft");
export const Paperclip = createBusinessIcon("attached-file", "Paperclip");
export const Pencil = createBusinessIcon("pen-tool", "Pencil");
export const PencilLine = createBusinessIcon("calligraphy", "PencilLine");
export const Phone = createBusinessIcon("phone-receiver", "Phone");
export const QrCode = createBusinessIcon("web-sitemap", "QrCode");
export const RefreshCcw = createBusinessIcon("data-transfer", "RefreshCcw");
export const RefreshCw = createBusinessIcon("data-transfer", "RefreshCw");
export const Rss = createBusinessIcon("megaphone", "Rss");
export const Save = createBusinessIcon("document-folder", "Save");
export const Search = createBusinessIcon("web-search", "Search");
export const Send = createBusinessIcon("email", "Send");
export const ServerCog = createBusinessIcon("server-network", "ServerCog");
export const Settings = createBusinessIcon("system-setting", "Settings");
export const Settings2 = createBusinessIcon("setting-tools", "Settings2");
export const ShieldCheck = createBusinessIcon("web-security", "ShieldCheck");
export const SlidersHorizontal = createBusinessIcon("configuration", "SlidersHorizontal");
export const Smartphone = createBusinessIcon("mobile-layout", "Smartphone");
export const Sparkles = createBusinessIcon("bright-idea", "Sparkles");
export const Star = createBusinessIcon("business-award", "Star");
export const Target = createBusinessIcon("business-target", "Target");
export const TimerReset = createBusinessIcon("time-flow", "TimerReset");
export const Trash2 = createBusinessIcon("file-drawer", "Trash2");
export const TrendingUp = createBusinessIcon("financial-growth", "TrendingUp");
export const Type = createBusinessIcon("article-writing", "Type");
export const Upload = createBusinessIcon("online-data", "Upload");
export const UserCheck = createBusinessIcon("approved-cv", "UserCheck");
export const UserCog = createBusinessIcon("administrator", "UserCog");
export const UserPlus = createBusinessIcon("headhunting", "UserPlus");
export const UserRound = createBusinessIcon("employee-card", "UserRound");
export const UserRoundCheck = createBusinessIcon("best-employee", "UserRoundCheck");
export const UsersRound = createBusinessIcon("global-team", "UsersRound");
export const Warehouse = createBusinessIcon("file-drawer", "Warehouse");
export const Workflow = createBusinessIcon("flow-diagram", "Workflow");
export const Wrench = createBusinessIcon("repairing-tools", "Wrench");
export const Zap = createBusinessIcon("advancement", "Zap");
