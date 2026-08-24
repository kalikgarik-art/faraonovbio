import React from 'react';
import { X, Globe, ExternalLink, Check, Copy, Terminal, Shield, Sparkles } from 'lucide-react';

interface DomainGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainName?: string;
}

export const DomainGuideModal: React.FC<DomainGuideModalProps> = ({
  isOpen,
  onClose,
  domainName = 'faraonov.lol'
}) => {
  const [copiedStep, setCopiedStep] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        id="domain-guide-modal"
        className="relative w-full max-w-2xl bg-zinc-950/95 border border-white/10 rounded-2xl p-6 shadow-2xl text-zinc-200 my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Как запустить сайт на домене <span className="text-indigo-400 font-mono-code">{domainName}</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Пошаговая инструкция по бесплатному хостингу и привязке своего домена
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps container */}
        <div className="space-y-5 text-sm">
          {/* Step 1: Registration of domain */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-mono-code">1</span>
                Покупка домена ({domainName})
              </span>
              <span className="text-xs text-zinc-400">~1.5 - $3 / год</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Доменную зону <b>.lol</b>, <b>.bio</b>, <b>.me</b> или <b>.xyz</b> можно купить на регистраторах:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['Porkbun.com', 'Namecheap.com', 'Reg.ru', 'Cloudflare Registrar'].map((reg) => (
                <span key={reg} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono-code text-zinc-300">
                  {reg}
                </span>
              ))}
            </div>
          </div>

          {/* Step 2: Hosting code on Vercel / GitHub */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5">
            <span className="font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-mono-code">2</span>
              Бесплатный хостинг (Vercel / GitHub Pages / Cloudflare Pages)
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Сайт является статическим React/Vite приложением, поэтому его можно бесплатно захостить 24/7 с неограниченным трафиком и бесплатным SSL-сертификатом (замочек HTTPS):
            </p>
            <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-1.5 pl-1">
              <li>Зарегистрируйтесь на <b className="text-white">GitHub.com</b> и создайте новый репозиторий (например, <code className="text-indigo-300">faraonov-bio</code>).</li>
              <li>Скачайте или скопируйте файлы этого проекта и сделайте push в репозиторий.</li>
              <li>Зайдите на <b className="text-white">Vercel.com</b> (или Cloudflare Pages), нажмите <b>Add New Project</b> и выберите ваш репозиторий.</li>
              <li>Нажмите <b>Deploy</b> — через 20 секунд сайт будет онлайн!</li>
            </ol>
          </div>

          {/* Step 3: Linking custom domain DNS */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
            <span className="font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-mono-code">3</span>
              Привязка домена в DNS панели
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              В панели вашего проекта на Vercel перейдите в <b>Settings → Domains</b> и введите <code className="text-indigo-300 font-bold">{domainName}</code>.
              Затем в панели регистратора вашего домена добавьте следующие DNS-записи:
            </p>

            {/* DNS Records Table */}
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/40">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-white/5 text-zinc-400 border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Тип (Type)</th>
                    <th className="p-2.5">Имя (Host / Name)</th>
                    <th className="p-2.5">Значение (Value)</th>
                    <th className="p-2.5 text-right">Копировать</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-300">A</td>
                    <td className="p-2.5">@</td>
                    <td className="p-2.5">76.76.21.21</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => copyToClipboard('76.76.21.21', 'a-record')}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300"
                        title="Копировать IP"
                      >
                        {copiedStep === 'a-record' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-300">CNAME</td>
                    <td className="p-2.5">www</td>
                    <td className="p-2.5">cname.vercel-dns.com</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => copyToClipboard('cname.vercel-dns.com', 'cname-record')}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300"
                        title="Копировать CNAME"
                      >
                        {copiedStep === 'cname-record' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-zinc-400">
              DNS записи вступают в силу в течение 5-30 минут. После этого ваш сайт будет открываться напрямую по адресу <b>https://{domainName}</b>!
            </p>
          </div>

          {/* Quick config edit tip */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-200">
              <b>Как легко менять текст, баннеры и фон:</b>
              <br />
              Вы можете настроить все параметры прямо в визуальном редакторе (кнопка ⚙️ в углу экрана), а затем скопировать сгенерированный файл конфигурации <code className="text-white bg-black/40 px-1 py-0.5 rounded">src/config/defaultConfig.ts</code> в свой репозиторий.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
          >
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
