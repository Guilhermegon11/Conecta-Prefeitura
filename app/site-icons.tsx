import { forwardRef, useId, type ComponentType, type SVGProps } from "react";

export {
  ArrowRight,
  ArrowUpRight,
  Bus,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
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

function createBusinessIcon(asset: string, displayName: string) {
  const BusinessGlyph = forwardRef<SVGSVGElement, SiteIconProps>(function BusinessGlyph(
    {
      size = 24,
      color = "currentColor",
      fill,
      stroke,
      strokeWidth: _strokeWidth,
      absoluteStrokeWidth: _absoluteStrokeWidth,
      children: _children,
      style,
      ...props
    },
    ref,
  ) {
    const maskId = `pc-business-icon-${useId().replace(/:/g, "")}`;
    const accessible = Boolean(props["aria-label"]);
    const resolvedColor = color === "currentColor" && stroke && stroke !== "none" ? stroke : color;
    const glyphFill = fill && fill !== "none" ? fill : "currentColor";

    return (
      <svg
        {...props}
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        color={resolvedColor}
        fill="none"
        role={props.role ?? (accessible ? "img" : undefined)}
        aria-hidden={props["aria-hidden"] ?? (accessible ? undefined : true)}
        focusable="false"
        data-business-icon={asset}
        style={style}
      >
        <mask
          id={maskId}
          x="0"
          y="0"
          width="24"
          height="24"
          maskUnits="userSpaceOnUse"
          style={{ maskType: "alpha" }}
        >
          <image
            href={`/icons/business/${asset}.svg`}
            x="0"
            y="0"
            width="24"
            height="24"
            preserveAspectRatio="xMidYMid meet"
          />
        </mask>
        <rect width="24" height="24" fill={glyphFill} mask={`url(#${maskId})`} />
      </svg>
    );
  });

  BusinessGlyph.displayName = displayName;
  return BusinessGlyph;
}

export const Accessibility = createBusinessIcon("customer-support", "Accessibility");
export const Activity = createBusinessIcon("performance-metrics", "Activity");
export const AlertTriangle = createBusinessIcon("warning-messages", "AlertTriangle");
export const Archive = createBusinessIcon("file-archive", "Archive");
export const BarChart3 = createBusinessIcon("analytics-board", "BarChart3");
export const Bell = createBusinessIcon("notification", "Bell");
export const BellRing = createBusinessIcon("notification", "BellRing");
export const BookOpen = createBusinessIcon("instructions", "BookOpen");
export const BookOpenCheck = createBusinessIcon("instructions", "BookOpenCheck");
export const Bot = createBusinessIcon("ai-assistant", "Bot");
export const BriefcaseBusiness = createBusinessIcon("virtual-business", "BriefcaseBusiness");
export const Building2 = createBusinessIcon("digital-banking", "Building2");
export const CalendarClock = createBusinessIcon("schedule", "CalendarClock");
export const CalendarDays = createBusinessIcon("schedule", "CalendarDays");
export const CalendarPlus = createBusinessIcon("schedule", "CalendarPlus");
export const CheckCircle2 = createBusinessIcon("approved", "CheckCircle2");
export const CircleAlert = createBusinessIcon("warning-messages", "CircleAlert");
export const CircleDollarSign = createBusinessIcon("business-report", "CircleDollarSign");
export const ClipboardCheck = createBusinessIcon("task-completed", "ClipboardCheck");
export const ClipboardList = createBusinessIcon("task-management", "ClipboardList");
export const Clock3 = createBusinessIcon("schedule", "Clock3");
export const Cloud = createBusinessIcon("cloud-computing", "Cloud");
export const Crown = createBusinessIcon("leadership", "Crown");
export const Database = createBusinessIcon("data-warehouse", "Database");
export const FileBadge = createBusinessIcon("contract", "FileBadge");
export const FileCheck2 = createBusinessIcon("approved", "FileCheck2");
export const FileClock = createBusinessIcon("schedule", "FileClock");
export const FilePlus2 = createBusinessIcon("online-document", "FilePlus2");
export const FileSearch = createBusinessIcon("searching", "FileSearch");
export const FileSignature = createBusinessIcon("digital-contract", "FileSignature");
export const FileText = createBusinessIcon("online-document", "FileText");
export const Files = createBusinessIcon("work-files", "Files");
export const Filter = createBusinessIcon("data-filtering", "Filter");
export const Gauge = createBusinessIcon("data-monitoring", "Gauge");
export const HardHat = createBusinessIcon("technical-services", "HardHat");
export const HeartHandshake = createBusinessIcon("partnership", "HeartHandshake");
export const HelpCircle = createBusinessIcon("customer-support", "HelpCircle");
export const History = createBusinessIcon("data-replication", "History");
export const Home = createBusinessIcon("virtual-business", "Home");
export const Inbox = createBusinessIcon("inbound-data", "Inbox");
export const KeyRound = createBusinessIcon("secure-access", "KeyRound");
export const Landmark = createBusinessIcon("digital-banking", "Landmark");
export const Layers3 = createBusinessIcon("flow-chart", "Layers3");
export const LayoutDashboard = createBusinessIcon("analytics-board", "LayoutDashboard");
export const List = createBusinessIcon("order-list", "List");
export const ListChecks = createBusinessIcon("task-completed", "ListChecks");
export const ListTodo = createBusinessIcon("task-management", "ListTodo");
export const LoaderCircle = createBusinessIcon("processing", "LoaderCircle");
export const LocateFixed = createBusinessIcon("location", "LocateFixed");
export const LockKeyhole = createBusinessIcon("security-lock", "LockKeyhole");
export const Mail = createBusinessIcon("email", "Mail");
export const Map = createBusinessIcon("map", "Map");
export const MapPin = createBusinessIcon("location", "MapPin");
export const MessageSquare = createBusinessIcon("discussion", "MessageSquare");
export const MessageSquarePlus = createBusinessIcon("discussion", "MessageSquarePlus");
export const MessageSquareText = createBusinessIcon("discussion", "MessageSquareText");
export const MessagesSquare = createBusinessIcon("discussion", "MessagesSquare");
export const Network = createBusinessIcon("network", "Network");
export const Newspaper = createBusinessIcon("business-report", "Newspaper");
export const NotebookPen = createBusinessIcon("paperwork", "NotebookPen");
export const PanelsTopLeft = createBusinessIcon("business-setting", "PanelsTopLeft");
export const Paperclip = createBusinessIcon("file-sharing", "Paperclip");
export const Pencil = createBusinessIcon("online-editing", "Pencil");
export const PencilLine = createBusinessIcon("online-editing", "PencilLine");
export const Phone = createBusinessIcon("phone-call", "Phone");
export const QrCode = createBusinessIcon("qr-code", "QrCode");
export const RefreshCcw = createBusinessIcon("data-replication", "RefreshCcw");
export const RefreshCw = createBusinessIcon("data-replication", "RefreshCw");
export const Rss = createBusinessIcon("worldwide-announcement", "Rss");
export const Save = createBusinessIcon("cloud-storage", "Save");
export const Search = createBusinessIcon("searching", "Search");
export const Send = createBusinessIcon("mail", "Send");
export const ServerCog = createBusinessIcon("server-stack", "ServerCog");
export const Settings = createBusinessIcon("business-setting", "Settings");
export const Settings2 = createBusinessIcon("business-setting", "Settings2");
export const ShieldCheck = createBusinessIcon("protection", "ShieldCheck");
export const SlidersHorizontal = createBusinessIcon("data-filtering", "SlidersHorizontal");
export const Smartphone = createBusinessIcon("mobile-application", "Smartphone");
export const Sparkles = createBusinessIcon("inspiration", "Sparkles");
export const Star = createBusinessIcon("achievement", "Star");
export const Target = createBusinessIcon("business-goal", "Target");
export const TimerReset = createBusinessIcon("schedule", "TimerReset");
export const Trash2 = createBusinessIcon("data-cleaning", "Trash2");
export const TrendingUp = createBusinessIcon("trend-analysis", "TrendingUp");
export const Type = createBusinessIcon("content", "Type");
export const Upload = createBusinessIcon("upload-data", "Upload");
export const UserCheck = createBusinessIcon("employee-selection", "UserCheck");
export const UserCog = createBusinessIcon("account-management", "UserCog");
export const UserPlus = createBusinessIcon("employee-selection", "UserPlus");
export const UserRound = createBusinessIcon("account-management", "UserRound");
export const UserRoundCheck = createBusinessIcon("employee-selection", "UserRoundCheck");
export const UsersRound = createBusinessIcon("social-group", "UsersRound");
export const Warehouse = createBusinessIcon("data-warehouse", "Warehouse");
export const Workflow = createBusinessIcon("flow-chart", "Workflow");
export const Wrench = createBusinessIcon("technical-support", "Wrench");
export const Zap = createBusinessIcon("startup-launch", "Zap");
