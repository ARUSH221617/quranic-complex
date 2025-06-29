import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define the structure for language options
interface LanguageOption {
  code: string;
  name: string;
}

// List of supported languages for speech recognition
const languages: LanguageOption[] = [
  { code: "fa-IR", name: "Persian (Iran)" },
  { code: "en-US", name: "English (US)" },
  { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "fr-FR", name: "French (France)" },
  { code: "de-DE", name: "German (Germany)" },
  { code: "zh-CN", name: "Chinese (Mandarin, Simplified)" },
  { code: "ja-JP", name: "Japanese (Japan)" },
  { code: "ru-RU", name: "Russian (Russia)" },
  { code: "hi-IN", name: "Hindi (India)" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  className?: string;
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  className,
}: LanguageSelectorProps) {
  return (
    <div className={className}>
      <Label
        htmlFor="language-select"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Voice Recognition Language
      </Label>
      <Select value={selectedLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
