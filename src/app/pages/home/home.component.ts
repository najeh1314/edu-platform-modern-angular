import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  template: `
    <app-navbar />

    <!-- Hero -->
    <section class="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
      <div class="max-w-7xl mx-auto px-6 py-24 text-center">
        <div class="inline-flex items-center gap-2 bg-white/10 text-white/90 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <i class="bi bi-stars"></i> {{ t().heroTagline }}
        </div>
        <h1 class="text-5xl md:text-6xl font-bold leading-tight mb-6">
          {{ t().heroTitle1 }}<br>
          {{ t().heroTitle2 }} <span class="text-blue-300">{{ t().heroTitle3 }}</span>
        </h1>
        <p class="text-lg text-blue-100 max-w-2xl mx-auto mb-10">{{ t().heroSubtitle }}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a [routerLink]="['/register']"
             class="inline-flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg">
            <i class="bi bi-rocket-takeoff-fill"></i> {{ t().startFree }}
          </a>
          <a [routerLink]="['/teachers']"
             class="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-medium px-8 py-3.5 rounded-xl transition-all">
            <i class="bi bi-person-video3"></i> {{ t().seeTutors }}
          </a>
        </div>
        <div class="flex items-center justify-center gap-8 mt-12 text-sm text-blue-200">
          <span class="flex items-center gap-1.5"><i class="bi bi-patch-check-fill"></i> {{ t().verifiedTeachers }}</span>
          <span class="flex items-center gap-1.5"><i class="bi bi-clock"></i> {{ t().flexibleHours }}</span>
          <span class="flex items-center gap-1.5"><i class="bi bi-graph-up-arrow"></i> {{ t().provenResults }}</span>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="bg-white border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        @for (stat of stats(); track stat.label) {
          <div class="text-center">
            <i [class]="'bi ' + stat.icon + ' text-3xl text-blue-700 block mb-2'"></i>
            <p class="text-3xl font-bold text-blue-900">{{ stat.value }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ stat.label }}</p>
          </div>
        }
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-7xl mx-auto px-6 py-20">
      <div class="text-center mb-14">
        <h2 class="text-3xl font-bold text-gray-900 mb-3">{{ t().whyChoose }}</h2>
        <p class="text-gray-500 max-w-xl mx-auto">{{ t().whySubtitle }}</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        @for (f of features(); track f.title) {
          <div class="card p-6 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <i [class]="'bi ' + f.icon + ' text-2xl text-blue-700'"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ f.title }}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">{{ f.desc }}</p>
          </div>
        }
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-blue-900 text-white">
      <div class="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 class="text-3xl font-bold mb-4">{{ t().ctaTitle }}</h2>
        <p class="text-blue-100 mb-8">{{ t().ctaSubtitle }}</p>
        <a [routerLink]="['/register']"
           class="inline-flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg">
          <i class="bi bi-person-plus-fill"></i> {{ t().createFreeAccount }}
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 text-sm">
      <div class="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-2 text-white font-bold">
          <i class="bi bi-mortarboard-fill text-blue-400 text-lg"></i> EduPlatform
        </div>
        <p>© 2026 EduPlatform. {{ t().allRights }}</p>
        <div class="flex gap-4">
          <a [routerLink]="['/courses']" class="hover:text-white transition-colors">{{ t().courses }}</a>
          <a [routerLink]="['/teachers']" class="hover:text-white transition-colors">{{ t().teachers }}</a>
        </div>
      </div>
    </footer>
  `
})
export class HomeComponent {
  lang = inject(LangService);
  t = this.lang.t;

  stats() {
    const l = this.lang.lang();
    return [
      { value: '500+', label: l === 'ar' ? 'مدرسون موثقون' : (l === 'en' ? 'Certified teachers' : 'Enseignants certifiés'), icon: 'bi-person-check-fill' },
      { value: '15K+', label: l === 'ar' ? 'طلاب مدعومون' : (l === 'en' ? 'Students supported' : 'Élèves accompagnés'), icon: 'bi-people-fill' },
      { value: '98%',  label: l === 'ar' ? 'نسبة الرضا' : (l === 'en' ? 'Satisfaction rate' : 'Taux de satisfaction'), icon: 'bi-emoji-smile-fill' },
      { value: '50+',  label: l === 'ar' ? 'مادة متاحة' : (l === 'en' ? 'Subjects available' : 'Matières disponibles'), icon: 'bi-journal-bookmark-fill' },
    ];
  }

  features() {
    const l = this.lang.lang();
    if (l === 'en') return [
      { icon: 'bi-patch-check-fill', title: 'Certified tutors', desc: 'All our teachers are verified and evaluated by our teams to guarantee teaching quality.' },
      { icon: 'bi-robot', title: 'Built-in AI tutor', desc: 'Our AI generates tests, corrects homework and answers your questions 24/7.' },
      { icon: 'bi-bar-chart-line-fill', title: 'Personalised tracking', desc: 'Detailed dashboards to track each student\'s progress subject by subject.' },
      { icon: 'bi-calendar2-week-fill', title: 'Total flexibility', desc: 'Schedule your sessions according to your availability, in person or remotely.' },
      { icon: 'bi-chat-dots-fill', title: 'Direct communication', desc: 'Chat directly with your tutors, receive detailed feedback after each session.' },
      { icon: 'bi-shield-lock-fill', title: 'Secure payment', desc: 'Pay for your sessions securely. Money-back guarantee if the session doesn\'t suit you.' },
    ];
    if (l === 'ar') return [
      { icon: 'bi-patch-check-fill', title: 'مدرسون معتمدون', desc: 'جميع معلمينا موثقون ومُقيَّمون لضمان جودة التعليم.' },
      { icon: 'bi-robot', title: 'مدرس ذكي مدمج', desc: 'يُنشئ الذكاء الاصطناعي اختبارات ويُصحح الواجبات ويُجيب على أسئلتك على مدار الساعة.' },
      { icon: 'bi-bar-chart-line-fill', title: 'متابعة شخصية', desc: 'لوحات تحكم تفصيلية لمتابعة تقدم كل طالب مادةً بمادة.' },
      { icon: 'bi-calendar2-week-fill', title: 'مرونة كاملة', desc: 'حدد مواعيد جلساتك وفق توفرك، حضورياً أو عن بُعد.' },
      { icon: 'bi-chat-dots-fill', title: 'تواصل مباشر', desc: 'تحدث مع مدرسيك مباشرةً واستقبل ملاحظات تفصيلية بعد كل جلسة.' },
      { icon: 'bi-shield-lock-fill', title: 'دفع آمن', desc: 'ادفع بأمان تام. ضمان استرداد الأموال إن لم تناسبك الجلسة.' },
    ];
    return [
      { icon: 'bi-patch-check-fill', title: 'Tuteurs certifiés', desc: 'Tous nos enseignants sont vérifiés et évalués pour garantir la qualité de l\'enseignement.' },
      { icon: 'bi-robot', title: 'IA Tuteur intégrée', desc: 'Notre IA génère des tests, corrige les devoirs et répond à vos questions 24h/24.' },
      { icon: 'bi-bar-chart-line-fill', title: 'Suivi personnalisé', desc: 'Tableaux de bord détaillés pour suivre la progression de chaque élève matière par matière.' },
      { icon: 'bi-calendar2-week-fill', title: 'Flexibilité totale', desc: 'Planifiez vos séances selon vos disponibilités, en présentiel ou à distance.' },
      { icon: 'bi-chat-dots-fill', title: 'Communication directe', desc: 'Échangez directement avec vos tuteurs, recevez des retours détaillés après chaque séance.' },
      { icon: 'bi-shield-lock-fill', title: 'Paiement sécurisé', desc: 'Réglez vos séances en toute sécurité. Remboursement garanti si la séance ne vous convient pas.' },
    ];
  }
}
