import { Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LangService } from '../../core/services/lang.service';
import { HttpClient } from '@angular/common/http';

interface Message { role: 'user' | 'assistant'; content: string; }

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div>
          <h1 class="page-title">🤖 {{ lang.t().aiTutor }}</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">{{ lang.t().aiSubtitle }}</p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          @for (tab of tabs(); track tab.id) {
            <button (click)="activeTab = tab.id"
              [class]="activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-900 dark:text-blue-300 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'"
              class="px-4 py-2 rounded-lg text-sm transition-all">{{ tab.label }}</button>
          }
        </div>

        <!-- Chat Tab -->
        @if (activeTab === 'chat') {
          <div class="card dark:bg-gray-900 flex flex-col" style="height: 60vh">
            <div #messagesEl class="flex-1 overflow-y-auto p-4 space-y-4">
              @if (messages().length === 0) {
                <div class="h-full flex items-center justify-center text-center">
                  <div>
                    <p class="text-5xl mb-4">🤖</p>
                    <p class="font-semibold text-gray-800 dark:text-gray-200 mb-2">{{ lang.t().aiGreeting }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ lang.t().aiGreetingSub }}</p>
                  </div>
                </div>
              }
              @for (msg of messages(); track $index) {
                <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
                  <div [class]="msg.role === 'user' ? 'bg-blue-900 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'"
                       class="rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap">
                    {{ msg.content }}
                  </div>
                </div>
              }
              @if (aiTyping()) {
                <div class="flex justify-start">
                  <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 text-sm text-gray-500">
                    <span class="inline-flex gap-1">
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:.1s"></span>
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:.2s"></span>
                    </span>
                  </div>
                </div>
              }
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
              <input type="text" class="input flex-1" [(ngModel)]="chatInput"
                     [placeholder]="lang.t().chatPlaceholder"
                     (keyup.enter)="sendMessage()" [disabled]="aiTyping()">
              <button class="btn-primary px-4" (click)="sendMessage()"
                      [disabled]="!chatInput.trim() || aiTyping()">{{ lang.t().sendMessage }}</button>
            </div>
          </div>
        }

        <!-- Generate Test Tab -->
        @if (activeTab === 'test') {
          <div class="card dark:bg-gray-900 p-6">
            <h2 class="section-title mb-4">{{ lang.t().generateTestTitle }}</h2>
            <div class="grid md:grid-cols-2 gap-4 mb-5">
              <div>
                <label class="label">{{ lang.t().subject }}</label>
                <input type="text" class="input" [(ngModel)]="testForm.subject" placeholder="Maths">
              </div>
              <div>
                <label class="label">{{ lang.t().level }}</label>
                <select class="input" [(ngModel)]="testForm.level">
                  <option>6ème</option><option>5ème</option><option>4ème</option><option>3ème</option>
                  <option>Seconde</option><option>Première</option><option>Terminale</option><option>Bac+1</option>
                </select>
              </div>
              <div>
                <label class="label">{{ lang.t().numQuestions }}</label>
                <select class="input" [(ngModel)]="testForm.numQuestions">
                  <option [value]="3">3</option><option [value]="5">5</option><option [value]="10">10</option>
                </select>
              </div>
              <div>
                <label class="label">{{ lang.t().difficulty }}</label>
                <select class="input" [(ngModel)]="testForm.difficulty">
                  <option value="easy">{{ lang.t().easy }}</option>
                  <option value="medium">{{ lang.t().medium }}</option>
                  <option value="hard">{{ lang.t().hard }}</option>
                </select>
              </div>
            </div>
            <button class="btn-primary" (click)="generateTest()" [disabled]="generatingTest()">
              @if (generatingTest()) { {{ lang.t().generatingTest }} } @else { {{ lang.t().generateTestBtn }} }
            </button>

            @if (generatedTest()) {
              <div class="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-4">{{ generatedTest().title }}</h3>
                <div class="space-y-4">
                  @for (q of generatedTest().questions; track $index) {
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p class="font-medium text-gray-800 dark:text-gray-200 mb-2">{{ $index + 1 }}. {{ q.question }}</p>
                      @if (q.options) {
                        <ul class="space-y-1">
                          @for (opt of q.options; track opt) {
                            <li class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <span class="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"></span>{{ opt }}
                            </li>
                          }
                        </ul>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Homework Correction Tab -->
        @if (activeTab === 'homework') {
          <div class="card dark:bg-gray-900 p-6">
            <h2 class="section-title mb-4">{{ lang.t().correctHomeworkTitle }}</h2>
            <div class="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="label">{{ lang.t().subject }}</label>
                <input type="text" class="input" [(ngModel)]="hwForm.subject" placeholder="Physique">
              </div>
              <div>
                <label class="label">{{ lang.t().level }}</label>
                <select class="input" [(ngModel)]="hwForm.level">
                  <option>6ème</option><option>Terminale</option><option>Bac+1</option>
                </select>
              </div>
            </div>
            <div class="mb-4">
              <label class="label">{{ lang.t().yourHomework }}</label>
              <textarea class="input h-32 resize-none" [(ngModel)]="hwForm.homeworkText"
                        [placeholder]="lang.t().homeworkPlaceholder"></textarea>
            </div>
            <button class="btn-primary" (click)="correctHomework()" [disabled]="correcting()">
              @if (correcting()) { {{ lang.t().correcting }} } @else { {{ lang.t().correctHomeworkBtn }} }
            </button>

            @if (hwResult()) {
              <div class="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {{ hwResult().grade }}
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ hwResult().overallScore }}/100</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">{{ hwResult().summary }}</p>
                  </div>
                </div>
                @if (hwResult().corrections?.length) {
                  <div class="space-y-2">
                    @for (c of hwResult().corrections; track $index) {
                      <div class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                        <strong>Erreur:</strong> {{ c.error }} → <strong>Correction:</strong> {{ c.correction }}
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </app-dashboard-layout>
  `
})
export class AiComponent implements OnInit {
  api   = inject(ApiService);
  auth  = inject(AuthService);
  toast = inject(ToastService);
  lang  = inject(LangService);
  http  = inject(HttpClient);

  @ViewChild('messagesEl') messagesEl?: ElementRef;

  activeTab = 'chat';

  tabs() {
    const t = this.lang.t();
    return [
      { id: 'chat',     label: t.chatTab },
      { id: 'test',     label: t.testTab },
      { id: 'homework', label: t.homeworkTab },
    ];
  }

  messages   = signal<Message[]>([]);
  aiTyping   = signal(false);
  chatInput  = '';
  convId     = signal<number | null>(null);

  testForm = { subject: 'Maths', level: 'Terminale', numQuestions: 5, difficulty: 'medium' };
  generatingTest = signal(false);
  generatedTest  = signal<any>(null);

  hwForm   = { subject: '', level: 'Terminale', language: 'fr', homeworkText: '' };
  correcting = signal(false);
  hwResult   = signal<any>(null);

  ngOnInit() {
    this.api.post<any>('/spring/api/ai/conversations', { mode: 'tutor', subject: 'Général', title: 'Session Angular' }).subscribe({
      next: (c) => this.convId.set(c.id)
    });
  }

  sendMessage() {
    const text = this.chatInput.trim();
    if (!text || this.aiTyping()) return;
    this.chatInput = '';
    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.aiTyping.set(true);
    this.scrollDown();

    const token = this.auth.getToken();
    const convId = this.convId();
    if (!convId) { this.aiTyping.set(false); return; }

    const url = `/spring/api/ai/conversations/${convId}/messages`;
    const es = new EventSource(url + `?content=${encodeURIComponent(text)}&Authorization=${encodeURIComponent('Bearer ' + (token ?? ''))}`);

    let assistantMsg = '';
    this.messages.update(m => [...m, { role: 'assistant', content: '' }]);

    es.onmessage = (event) => {
      if (event.data === '[DONE]') { es.close(); this.aiTyping.set(false); return; }
      try {
        const d = JSON.parse(event.data);
        if (d.content) {
          assistantMsg += d.content;
          this.messages.update(m => { const copy = [...m]; copy[copy.length - 1] = { role: 'assistant', content: assistantMsg }; return copy; });
          this.scrollDown();
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      this.aiTyping.set(false);
      if (!assistantMsg) {
        this.messages.update(m => { const copy = [...m]; copy[copy.length - 1] = { role: 'assistant', content: this.lang.t().aiError }; return copy; });
      }
    };
  }

  scrollDown() {
    setTimeout(() => { if (this.messagesEl) this.messagesEl.nativeElement.scrollTop = this.messagesEl.nativeElement.scrollHeight; }, 50);
  }

  generateTest() {
    this.generatingTest.set(true);
    this.generatedTest.set(null);
    const lang = this.lang.lang();
    this.api.post<any>('/spring/api/ai/generate-test', { ...this.testForm, language: lang }).subscribe({
      next: (t) => { this.generatedTest.set(t); this.generatingTest.set(false); },
      error: () => { this.toast.error(this.lang.t().generationError); this.generatingTest.set(false); }
    });
  }

  correctHomework() {
    if (!this.hwForm.homeworkText.trim()) { this.toast.error(this.lang.t().enterHomework); return; }
    this.correcting.set(true);
    this.hwResult.set(null);
    const lang = this.lang.lang();
    this.api.post<any>('/spring/api/ai/correct-homework', { ...this.hwForm, language: lang }).subscribe({
      next: (r) => { this.hwResult.set(r); this.correcting.set(false); },
      error: () => { this.toast.error(this.lang.t().correctionError); this.correcting.set(false); }
    });
  }
}
