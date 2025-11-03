import Link from "next/link"
import { useTranslations } from "next-intl"

export default function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="bg-secondary/90 text-secondary-text-foreground">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* About section */}
          <div>
            <h3 className="text-xl font-bold">{t('brand')}</h3>
            <p className="mt-4 text-base leading-7 text-secondary-text-foreground/90">
              {t('description')}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-bold">{t('quickLinks')}</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-base text-secondary-text-foreground/90 hover:text-secondary-text-foreground transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/programs" className="text-base text-secondary-text-foreground/90 hover:text-secondary-text-foreground transition-colors">
                  {t('programs')}
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-base text-secondary-text-foreground/90 hover:text-secondary-text-foreground transition-colors">
                  {t('news')}
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-base text-secondary-text-foreground/90 hover:text-secondary-text-foreground transition-colors">
                  {t('gallery')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-base text-secondary-text-foreground/90 hover:text-secondary-text-foreground transition-colors">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-lg font-bold">{t('contactInfo')}</h3>
            <address className="mt-4 not-italic">
              <p className="text-base text-secondary-text-foreground/90">{t('address')}</p>
              <p className="mt-3 text-base text-secondary-text-foreground/90">{t('phone')}</p>
              <p className="mt-3 text-base text-secondary-text-foreground/90">{t('email')}</p>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t border-secondary-foreground/20 pt-8 text-center">
          <p className="text-base text-secondary-text-foreground/80">
            &copy; {new Date().getFullYear()} <a href="https://arush.ir" className="text-primary">ARUSH</a>. {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
