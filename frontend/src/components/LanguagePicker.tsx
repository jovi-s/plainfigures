import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' }
];

export function LanguagePicker() {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Save to localStorage for persistence
    localStorage.setItem('selectedLanguage', languageCode);
  };



  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-neutral-500" />
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder={t('language.select')} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code} className="text-xs">
              <div className="flex flex-col items-start">
                <span className="font-medium">{language.nativeName}</span>
                {language.nativeName !== language.name && (
                  <span className="text-xs text-neutral-500">{language.name}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
