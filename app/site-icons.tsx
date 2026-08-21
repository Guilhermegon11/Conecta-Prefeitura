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
