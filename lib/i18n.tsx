"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export type Locale = "en" | "ru" | "kk"

const translations: Record<string, Record<Locale, string>> = {
  // ── Landing ──
  "landing.badge": { en: "Municipal Service Platform", ru: "Платформа муниципальных услуг", kk: "Муниципалдық қызмет платформасы" },
  "landing.hero.title": { en: "Keep your city running", ru: "Сделайте ваш город", kk: "Қалаңызды" },
  "landing.hero.highlight": { en: "smoothly", ru: "комфортным", kk: "ыңғайлы етіңіз" },
  "landing.hero.subtitle": { en: "Report civic issues, track resolutions in real time, and collaborate with city workers to build a better community.", ru: "Сообщайте о проблемах города, отслеживайте решения в реальном времени и сотрудничайте с городскими службами.", kk: "Қала мәселелерін хабарлаңыз, шешімдерді нақты уақытта бақылаңыз және қала қызметкерлерімен бірге жақсы қоғам құрыңыз." },
  "landing.cta.report": { en: "Report an Issue", ru: "Сообщить о проблеме", kk: "Мәселе туралы хабарлау" },
  "landing.cta.signin": { en: "Sign in to Dashboard", ru: "Войти в панель", kk: "Панельге кіру" },
  "landing.stat.resolved": { en: "Issues Resolved", ru: "Решено проблем", kk: "Шешілген мәселелер" },
  "landing.stat.response": { en: "Avg. Response", ru: "Сред. ответ", kk: "Орт. жауап" },
  "landing.stat.citizens": { en: "Active Citizens", ru: "Активных граждан", kk: "Белсенді азаматтар" },
  "landing.features.title": { en: "How it works", ru: "Как это работает", kk: "Қалай жұмыс істейді" },
  "landing.features.subtitle": { en: "Three simple steps to a better city", ru: "Три простых шага к лучшему городу", kk: "Жақсы қалаға үш қарапайым қадам" },
  "landing.feature1.title": { en: "Report Issues", ru: "Сообщите о проблеме", kk: "Мәселені хабарлаңыз" },
  "landing.feature1.desc": { en: "Submit service requests for potholes, streetlights, trash, and more in seconds.", ru: "Отправьте заявку на ямы, фонари, мусор и другие проблемы за секунды.", kk: "Шұңқырлар, көше шамдары, қоқыс және т.б. туралы өтінімді бірнеше секундта жіберіңіз." },
  "landing.feature2.title": { en: "Track on Map", ru: "Отслеживайте на карте", kk: "Картадан бақылаңыз" },
  "landing.feature2.desc": { en: "See all active requests plotted on an interactive map with real-time status.", ru: "Смотрите все активные заявки на интерактивной карте с обновлением в реальном времени.", kk: "Барлық белсенді өтінімдерді интерактивті картадан нақты уақытта көріңіз." },
  "landing.feature3.title": { en: "Monitor Progress", ru: "Контролируйте прогресс", kk: "Прогресті бақылаңыз" },
  "landing.feature3.desc": { en: "Follow every step from submission to resolution with a transparent status tracker.", ru: "Следите за каждым этапом от подачи до решения с прозрачным трекером статуса.", kk: "Өтінімнен шешімге дейін әрбір қадамды мөлдір статус трекерімен бақылаңыз." },
  "landing.footer": { en: "CityFix eGov Platform — Built for citizens, by citizens.", ru: "CityFix eGov Платформа — Создана для граждан, гражданами.", kk: "CityFix eGov Платформа — Азаматтар үшін, азаматтармен." },

  // ── Auth ──
  "auth.signin": { en: "Sign in", ru: "Войти", kk: "Кіру" },
  "auth.signup": { en: "Get started", ru: "Регистрация", kk: "Тіркелу" },
  "auth.welcome": { en: "Welcome back", ru: "Добро пожаловать", kk: "Қош келдіңіз" },
  "auth.signin.desc": { en: "Sign in to your eGov account", ru: "Войдите в ваш eGov аккаунт", kk: "eGov аккаунтыңызға кіріңіз" },
  "auth.email": { en: "Email", ru: "Электронная почта", kk: "Электрондық пошта" },
  "auth.password": { en: "Password", ru: "Пароль", kk: "Құпия сөз" },
  "auth.signing_in": { en: "Signing in...", ru: "Вход...", kk: "Кіру..." },
  "auth.no_account": { en: "Don't have an account?", ru: "Нет аккаунта?", kk: "Аккаунтыңыз жоқ па?" },
  "auth.create_account": { en: "Create account", ru: "Создать аккаунт", kk: "Аккаунт жасау" },
  "auth.create_title": { en: "Create an account", ru: "Создание аккаунта", kk: "Аккаунт жасау" },
  "auth.create_desc": { en: "Sign up with your eGov credentials", ru: "Зарегистрируйтесь с данными eGov", kk: "eGov деректерімен тіркеліңіз" },
  "auth.fullname": { en: "Full Name", ru: "Полное имя", kk: "Толық аты-жөні" },
  "auth.role": { en: "Role", ru: "Роль", kk: "Рөл" },
  "auth.role.citizen": { en: "Citizen - Report issues", ru: "Гражданин - Сообщить о проблеме", kk: "Азамат - Мәселе хабарлау" },
  "auth.role.worker": { en: "Field Worker - Resolve tasks", ru: "Работник - Выполнять задания", kk: "Қызметкер - Тапсырмаларды орындау" },
  "auth.role.admin": { en: "Administrator - Manage platform", ru: "Администратор - Управлять платформой", kk: "Әкімші - Платформаны басқару" },
  "auth.access_code": { en: "Access Code", ru: "Код доступа", kk: "Қатынау коды" },
  "auth.access_code.placeholder": { en: "Enter access code", ru: "Введите код доступа", kk: "Қатынау кодын енгізіңіз" },
  "auth.access_code.help": { en: "Contact your department administrator for the access code.", ru: "Свяжитесь с администратором вашего отдела для получения кода.", kk: "Қатынау кодын алу үшін бөлім әкімшісіне хабарласыңыз." },
  "auth.confirm_password": { en: "Confirm Password", ru: "Подтвердите пароль", kk: "Құпия сөзді растаңыз" },
  "auth.creating": { en: "Creating account...", ru: "Создание аккаунта...", kk: "Аккаунт жасалуда..." },
  "auth.has_account": { en: "Already have an account?", ru: "Уже есть аккаунт?", kk: "Аккаунтыңыз бар ма?" },
  "auth.error.title": { en: "Authentication Error", ru: "Ошибка аутентификации", kk: "��утентификация қатесі" },
  "auth.error.desc": { en: "Something went wrong during authentication. Please try again.", ru: "Что-то пошло не так при аутентификации. Попробуйте снова.", kk: "Аутентификация кезінде қате пайда болды. Қайтадан көріңіз." },
  "auth.error.back": { en: "Back to login", ru: "Вернуться к входу", kk: "Кіруге оралу" },
  "auth.success.title": { en: "Account created", ru: "Аккаунт создан", kk: "Аккаунт жасалды" },
  "auth.success.desc": { en: "Your account has been successfully created. You can now sign in.", ru: "Ваш аккаунт успешно создан. Теперь вы можете войти.", kk: "Аккаунтыңыз сәтті жасалды. Енді кіре аласыз." },
  "auth.success.go": { en: "Go to login", ru: "Перейти к входу", kk: "Кіруге өту" },
  "auth.password.min6": { en: "Min 6 characters", ru: "Мин. 6 символов", kk: "Кемінде 6 таңба" },
  "auth.error.passwords_mismatch": { en: "Passwords do not match", ru: "Пароли не совпадают", kk: "Құпия сөздер сәйкес келмейді" },
  "auth.error.password_short": { en: "Password must be at least 6 characters", ru: "Пароль должен быть не менее 6 символов", kk: "Құпия сөз кемінде 6 таңба болуы керек" },
  "auth.error.code_required": { en: "Access code is required", ru: "Необходим код доступа", kk: "Қатынау коды қажет" },
  "auth.error.code_invalid": { en: "Invalid access code. Contact your department administrator.", ru: "Неверный код доступа. Обратитесь к администратору.", kk: "Жарамсыз қатынау коды. Әкімшіге хабарласыңыз." },
  "auth.error.exists": { en: "An account with this email already exists. Please sign in instead.", ru: "Аккаунт с этой почтой уже существует. Пожалуйста, войдите.", kk: "Бұл электрондық поштамен аккаунт бар. Кіріңіз." },
  "auth.error.wrong_creds": { en: "Wrong email or password. Please try again.", ru: "Неверный email или пароль. Попробуйте снова.", kk: "Қате email немесе құпия сөз. Қайтадан көріңіз." },
  "auth.error.not_confirmed": { en: "Your email is not confirmed. Please contact support.", ru: "Ваш email не подтверждён. Свяжитесь с поддержкой.", kk: "Email расталмаған. Қолдау қызметіне хабарласыңыз." },

  // ── Roles ──
  "role.citizen": { en: "Citizen", ru: "Гражданин", kk: "Азамат" },
  "role.worker": { en: "Field Worker", ru: "Работник", kk: "Қызметкер" },
  "role.admin": { en: "Administrator", ru: "Администратор", kk: "Әкімші" },

  // ── Nav ──
  "nav.my_requests": { en: "My Requests", ru: "Мои заявки", kk: "Менің өтінімдерім" },
  "nav.new_request": { en: "New Request", ru: "Новая заявка", kk: "Жаңа өтінім" },
  "nav.map": { en: "Map", ru: "Карта", kk: "Карта" },
  "nav.my_tasks": { en: "My Tasks", ru: "Мои задания", kk: "Менің тапсырмаларым" },
  "nav.completed": { en: "Completed", ru: "Завершённые", kk: "Аяқталғандар" },
  "nav.field_map": { en: "Field Map", ru: "Полевая карта", kk: "Далалық карта" },
  "nav.overview": { en: "Overview", ru: "Обзор", kk: "Шолу" },
  "nav.all_requests": { en: "All Requests", ru: "Все заявки", kk: "Барлық өтінімдер" },
  "nav.city_map": { en: "City Map", ru: "Карта города", kk: "Қала картасы" },
  "nav.users": { en: "Users", ru: "Пользователи", kk: "Пайдаланушылар" },
  "nav.analytics": { en: "Analytics", ru: "Аналитика", kk: "Аналитика" },
  "nav.sla": { en: "SLA Tracking", ru: "Контроль SLA", kk: "SLA бақылау" },
  "nav.rankings": { en: "Worker Rankings", ru: "Рейтинг работников", kk: "Қызметкерлер рейтингі" },
  "nav.signout": { en: "Sign out", ru: "Выйти", kk: "Шығу" },

  // ── Statuses ──
  "status.submitted": { en: "Submitted", ru: "Подана", kk: "Жіберілді" },
  "status.assigned": { en: "Assigned", ru: "Назначена", kk: "Тағайындалды" },
  "status.in_progress": { en: "In Progress", ru: "В работе", kk: "Орындалуда" },
  "status.overdue": { en: "Overdue", ru: "Просрочена", kk: "Мерзімі өткен" },
  "status.resolved": { en: "Resolved", ru: "Решена", kk: "Шешілді" },
  "status.closed": { en: "Closed", ru: "Закрыта", kk: "Жабылды" },
  "status.all": { en: "All statuses", ru: "Все статусы", kk: "Барлық мәртебелер" },

  // ── Priorities ──
  "priority.low": { en: "Low", ru: "Низкий", kk: "Төмен" },
  "priority.medium": { en: "Medium", ru: "Средний", kk: "Орта" },
  "priority.high": { en: "High", ru: "Высокий", kk: "Жоғары" },
  "priority.urgent": { en: "Urgent", ru: "Срочный", kk: "Шұғыл" },

  // ── Citizen Dashboard ──
  "citizen.title": { en: "My Requests", ru: "Мои заявки", kk: "Менің өтінімдерім" },
  "citizen.subtitle": { en: "Track your submitted service requests", ru: "Отслеживайте ваши отправленные заявки", kk: "Жіберілген өтінімдеріңізді бақылаңыз" },
  "citizen.new": { en: "New Request", ru: "Новая заявка", kk: "Жаңа өтінім" },
  "citizen.search": { en: "Search requests...", ru: "Поиск заявок...", kk: "Өтінімдерді іздеу..." },
  "citizen.no_requests": { en: "No requests yet", ru: "Заявок пока нет", kk: "Әзірге өтінімдер жоқ" },
  "citizen.no_match": { en: "No matching requests", ru: "Нет подходящих заявок", kk: "Сәйкес өтінімдер жоқ" },
  "citizen.first_report": { en: "Report your first civic issue to get started.", ru: "Сообщите о первой проблеме, чтобы начать.", kk: "Бастау үшін алғашқы мәселені хабарлаңыз." },
  "citizen.adjust_filters": { en: "Try adjusting your filters.", ru: "Попробуйте изменить фильтры.", kk: "Сүзгілерді өзгертіп көріңіз." },
  "citizen.report_issue": { en: "Report Issue", ru: "Сообщить", kk: "Хабарлау" },

  // ── New Request ──
  "new.back": { en: "Back to requests", ru: "Назад к заявкам", kk: "Өтінімдерге оралу" },
  "new.title": { en: "Report a Civic Issue", ru: "Сообщить о проблеме", kk: "Қала мәселесін хабарлау" },
  "new.subtitle": { en: "Describe the problem. AI will evaluate whether it warrants dispatching a city crew.", ru: "Опишите проблему. ИИ оценит необходимость отправки городской бригады.", kk: "Мәселені сипаттаңыз. AI қала бригадасын жіберу қажеттілігін бағалайды." },
  "new.field.title": { en: "Title", ru: "Заголовок", kk: "Тақырып" },
  "new.field.title.placeholder": { en: "e.g. Large pothole on Main Street", ru: "Напр. Большая яма на ул. Главной", kk: "Мыс. Басты көшедегі үлкен шұңқыр" },
  "new.field.description": { en: "Description", ru: "Описание", kk: "Сипаттама" },
  "new.field.description.placeholder": { en: "Provide specific details: what the issue is, exact location, severity, how many people are affected...", ru: "Укажите детали: суть проблемы, точное местоположение, серьёзность, количество затронутых людей...", kk: "Нақты мәліметтерді көрс��тіңіз: мәселенің мәні, нақты орны, маңыздылығы, зардап шеккен адамдар саны..." },
  "new.field.category": { en: "Category", ru: "Категория", kk: "Санат" },
  "new.field.category.placeholder": { en: "Select category", ru: "Выберите категорию", kk: "Санатты таңдаңыз" },
  "new.field.priority": { en: "Priority (AI may adjust)", ru: "Приоритет (ИИ может изменить)", kk: "Басымдық (AI өзгерте алады)" },
  "new.field.location": { en: "Location", ru: "Местоположение", kk: "Орналасқан жері" },
  "new.field.location.placeholder": { en: "Address or coordinates", ru: "Адрес или координаты", kk: "Мекенжай немесе координаттар" },
  "new.field.photo": { en: "Photo (recommended for faster validation)", ru: "Фото (рекомендуется для быстрой проверки)", kk: "Фото (тез тексеру үшін ұсынылады)" },
  "new.photo.attach": { en: "Attach Photo", ru: "Прикрепить фото", kk: "Фото тіркеу" },
  "new.photo.change": { en: "Change Photo", ru: "Заменить фото", kk: "Фотоны ауыстыру" },
  "new.ai.approved": { en: "Report Approved by AI", ru: "Заявка одобрена ИИ", kk: "Өтінім AI-мен бекітілді" },
  "new.ai.rejected": { en: "Report Rejected by AI", ru: "Заявка отклонена ИИ", kk: "Өтінім AI-мен қабылданбады" },
  "new.ai.severity": { en: "Severity", ru: "Серьёзность", kk: "Маңыздылық" },
  "new.ai.priority_set": { en: "AI-assigned priority", ru: "Приоритет от ИИ", kk: "AI тағайындаған басымдық" },
  "new.ai.edit_hint": { en: "Edit your report details above and click \"Re-validate\" to try again.", ru: "Отредактируйте данные заявки выше и нажмите «Перепроверить».", kk: "Жоғарыда өтінім деректерін өзгертіп, «Қайта тексеру» түймесін басыңыз." },
  "new.btn.validate": { en: "Validate with AI", ru: "Проверить через ИИ", kk: "AI арқылы тексеру" },
  "new.btn.revalidate": { en: "Re-validate Report", ru: "Перепроверить заявку", kk: "Өтінімді қайта тексеру" },
  "new.btn.validating": { en: "AI is Reviewing...", ru: "ИИ проверяет...", kk: "AI тексеруде..." },
  "new.btn.submit": { en: "Submit Validated Report", ru: "Отправить проверенную заявку", kk: "Тексерілген өтінімді жіберу" },
  "new.btn.submitting": { en: "Submitting...", ru: "Отправка...", kk: "Жіберілуде..." },

  // ── Citizen Map ──
  "citizen.map.title": { en: "Request Map", ru: "Карта заявок", kk: "Өтінімдер картасы" },
  "citizen.map.subtitle": { en: "View your reported issues on the map", ru: "Смотрите ваши заявки на карте", kk: "Өтінімдеріңізді картадан қараңыз" },

  // ── Worker ──
  "worker.title": { en: "Worker Dashboard", ru: "Панель работника", kk: "Қызметкер панелі" },
  "worker.stats": { en: "active task", ru: "активное задание", kk: "белсенді тапсырма" },
  "worker.stats_plural": { en: "active tasks", ru: "активных заданий", kk: "белсенді тапсырма" },
  "worker.available_label": { en: "Available", ru: "Доступные", kk: "Қолжетімді" },
  "worker.my_tasks_label": { en: "My Tasks", ru: "Мои задания", kk: "Менің тапсырмаларым" },
  "worker.available": { en: "available", ru: "доступно", kk: "қолжетімді" },
  "worker.no_available": { en: "No available tasks", ru: "Нет доступных заданий", kk: "Қолжетімді тапсырмалар жоқ" },
  "worker.all_claimed": { en: "All current reports have been claimed.", ru: "Все текущие заявки распределены.", kk: "Барлық ағымдағы өтінімдер бөлінген." },
  "worker.no_active": { en: "No active tasks", ru: "Нет активных заданий", kk: "Белсенді тапсырмалар жоқ" },
  "worker.claim_hint": { en: "Claim a task from the Available tab to get started.", ru: "Возьмите задание из вкладки «Доступные».", kk: "Бастау үшін «Қолжетімді» қойындысынан тапсырма алыңыз." },
  "worker.claim": { en: "Claim This Task", ru: "Взять задание", kk: "Тапсырманы алу" },
  "worker.claiming": { en: "Claiming...", ru: "Назначение...", kk: "Тағайындалуда..." },
  "worker.collapse": { en: "Collapse", ru: "Свернуть", kk: "Жию" },
  "worker.update_status": { en: "Update Status", ru: "Обновить статус", kk: "Мәртебені жаңарту" },
  "worker.status": { en: "Status", ru: "Статус", kk: "Мәртебе" },
  "worker.comment": { en: "Comment", ru: "Комментарий", kk: "Түсініктеме" },
  "worker.comment.placeholder": { en: "Add a note about the work done...", ru: "Добавьте заметку о проделанной работе...", kk: "Атқарылған жұмыс туралы жазба қосыңыз..." },
  "worker.after_photo": { en: "After Photo", ru: "Фото после", kk: "Кейінгі фото" },
  "worker.after_photo_required": { en: "(required for AI check)", ru: "(обязательно для ИИ проверки)", kk: "(AI тексеруі үшін міндетті)" },
  "worker.after_photo_optional": { en: "(optional)", ru: "(необязательно)", kk: "(міндетті емес)" },
  "worker.before_photo": { en: "Before photo:", ru: "Фото до:", kk: "Алдыңғы фото:" },
  "worker.after_preview": { en: "After photo preview:", ru: "Превью фото после:", kk: "Кейінгі фото алдын ала көрінісі:" },
  "worker.ai_verify": { en: "Run AI Verification", ru: "Запустить ИИ проверку", kk: "AI тексеруін іске қосу" },
  "worker.ai_verifying": { en: "Running AI Analysis...", ru: "ИИ анализирует...", kk: "AI талдау жасауда..." },
  "worker.save": { en: "Save Update", ru: "Сохранить", kk: "Сақтау" },
  "worker.saving": { en: "Updating...", ru: "Обновление...", kk: "Жаңартылуда..." },
  "worker.ai_result": { en: "AI Verification Result", ru: "Результат ИИ проверки", kk: "AI тексеру нәтижесі" },
  "worker.issue_resolved": { en: "Issue Resolved", ru: "Проблема решена", kk: "Мәселе шешілді" },
  "worker.not_resolved": { en: "Not Fully Resolved", ru: "Не полностью решена", kk: "Толығымен шешілмеді" },

  // ── Worker History ──
  "worker.history.title": { en: "Completed Tasks", ru: "Завершённые задания", kk: "Аяқталған тапсырмалар" },
  "worker.history.count": { en: "completed task", ru: "завершённое задание", kk: "аяқталған тапсырма" },
  "worker.history.count_plural": { en: "completed tasks", ru: "завершённых заданий", kk: "аяқталған тапсырма" },
  "worker.history.empty": { en: "No completed tasks yet", ru: "Нет завершённых заданий", kk: "Аяқталған тапсырмалар жоқ" },
  "worker.history.hint": { en: "Tasks you resolve will appear here.", ru: "Решённые задания появятся здесь.", kk: "Шешілген тапсырмалар осында пайда болады." },
  "worker.history.ai": { en: "AI Verification", ru: "ИИ Проверка", kk: "AI тексеру" },

  // ── Worker Map ──
  "worker.map.title": { en: "Field Map", ru: "Полевая карта", kk: "Далалық карта" },
  "worker.map.subtitle": { en: "View your assigned tasks on the map", ru: "Смотрите ваши задания на карте", kk: "Тапсырмаларыңызды картадан қараңыз" },

  // ── Admin Overview ──
  "admin.title": { en: "Admin Overview", ru: "Обзор администратора", kk: "Әкімші шолуы" },
  "admin.subtitle": { en: "City-wide service request dashboard", ru: "Панель городских заявок", kk: "Қалалық өтінімдер панелі" },
  "admin.total": { en: "Total Requests", ru: "Всего заявок", kk: "Барлық өтінімдер" },
  "admin.pending": { en: "Pending", ru: "Ожидают", kk: "Күтуде" },
  "admin.in_progress": { en: "In Progress", ru: "В работе", kk: "Орындалуда" },
  "admin.resolved": { en: "Resolved", ru: "Решено", kk: "Шешілді" },
  "admin.recent": { en: "Recent Requests", ru: "Последние заявки", kk: "Соңғы өтінімдер" },
  "admin.view_all": { en: "View all", ru: "Все заявки", kk: "Барлығын көру" },
  "admin.no_requests": { en: "No requests yet", ru: "Заявок пока нет", kk: "Әзірге өтінімдер жоқ" },
  "admin.urgent": { en: "Urgent Issues", ru: "Срочные проблемы", kk: "Шұғыл мәселелер" },
  "admin.no_urgent": { en: "No urgent issues", ru: "Нет срочных проблем", kk: "Шұғыл мәселелер жоқ" },

  // ── Admin Requests ──
  "admin.requests.title": { en: "All Requests", ru: "Все заявки", kk: "Барлық өтінімдер" },
  "admin.requests.subtitle": { en: "Manage and dispatch service requests", ru: "Управляйте и распределяйте заявки", kk: "Өтінімдерді басқарыңыз және бөліңіз" },
  "admin.requests.search": { en: "Search requests...", ru: "Поиск заявок...", kk: "Өтінімдерді іздеу..." },
  "admin.requests.manage": { en: "Manage", ru: "Управлять", kk: "Басқару" },
  "admin.requests.dispatch": { en: "Dispatch", ru: "Назначение", kk: "Тағайындау" },
  "admin.requests.dispatch_desc": { en: "Assign a field worker and set priority for this request.", ru: "Назначьте работника и установите приоритет для этой заявки.", kk: "Қызметкерді тағайындаңыз және осы өтінімнің басымдығын орнатыңыз." },
  "admin.requests.assign": { en: "Assign Worker", ru: "Назначить работника", kk: "Қызметкерді тағайындау" },
  "admin.requests.select_worker": { en: "Select a worker", ru: "Выберите работника", kk: "Қызметкерді таңдаңыз" },
  "admin.requests.no_workers": { en: "No workers registered", ru: "Нет зарегистрированных работников", kk: "Тіркелген қызметкерлер жоқ" },
  "admin.requests.save": { en: "Save Changes", ru: "Сохранить", kk: "Сақтау" },
  "admin.requests.saving": { en: "Saving...", ru: "Сохранение...", kk: "Сақталуда..." },
  "admin.requests.delete": { en: "Delete", ru: "Удалить", kk: "Жою" },
  "admin.requests.delete_confirm": { en: "Are you sure you want to delete this request?", ru: "Вы уверены, что хотите удалить эту заявку?", kk: "Бұл өтінімді жойғыңыз келетініне сенімдісіз бе?" },
  "admin.requests.none": { en: "No requests found", ru: "Заявки не найдены", kk: "Өтінімдер табылмады" },
  "admin.requests.worker_label": { en: "Worker", ru: "Работник", kk: "Қызметкер" },
  "admin.requests.work_verified": { en: "Verified", ru: "Подтверждено", kk: "Расталды" },
  "admin.requests.work_not_done": { en: "Not Done", ru: "Не выполнено", kk: "Орындалмады" },
  "admin.requests.report_valid": { en: "Valid", ru: "Действительна", kk: "Жарамды" },
  "admin.requests.report_rejected": { en: "Rejected", ru: "Отклонена", kk: "Қабылданбады" },

  // ── Admin Users ──
  "admin.users.title": { en: "User Management", ru: "Управление пользователями", kk: "Пайдаланушыларды басқару" },
  "admin.users.total": { en: "total users", ru: "всего пользователей", kk: "барлық пайдаланушылар" },
  "admin.users.citizens": { en: "citizens", ru: "граждан", kk: "азаматтар" },
  "admin.users.workers": { en: "workers", ru: "работников", kk: "қызметкерлер" },
  "admin.users.admins": { en: "admins", ru: "администраторов", kk: "әкімшілер" },
  "admin.users.search": { en: "Search users...", ru: "Поиск пользователей...", kk: "Пайдаланушыларды іздеу..." },
  "admin.users.all_roles": { en: "All roles", ru: "Все роли", kk: "Барлық рөлдер" },
  "admin.users.none": { en: "No users found", ru: "Пользователи не найдены", kk: "Пайдаланушылар табылмады" },
  "admin.users.unnamed": { en: "Unnamed", ru: "Без имени", kk: "Атсыз" },
  "admin.users.joined": { en: "Joined", ru: "Присоединился", kk: "Қосылды" },

  // ── Admin Analytics ──
  "analytics.title": { en: "Analytics", ru: "Аналитика", kk: "Аналитика" },
  "analytics.subtitle": { en: "Insights and metrics for city service operations", ru: "Аналитика и метрики городских служб", kk: "Қала қызметтерінің аналитикасы мен көрсеткіштері" },
  "analytics.total": { en: "Total Requests", ru: "Всего заявок", kk: "Барлық өтінімдер" },
  "analytics.resolution_rate": { en: "Resolution Rate", ru: "Процент решений", kk: "Шешім пайызы" },
  "analytics.open_urgent": { en: "Open Urgent Issues", ru: "Открытые срочные", kk: "Ашық шұғыл мәселелер" },
  "analytics.daily": { en: "Requests (Last 14 Days)", ru: "Заявки (последние 14 дней)", kk: "Өтінімдер (соңғы 14 күн)" },
  "analytics.by_status": { en: "By Status", ru: "По статусу", kk: "Мәртебе бойынша" },
  "analytics.by_category": { en: "By Category", ru: "По категории", kk: "Санат бойынша" },
  "analytics.by_priority": { en: "By Priority", ru: "По приоритету", kk: "Басымдық бойынша" },
  "analytics.no_data": { en: "No data", ru: "Нет данных", kk: "Деректер жоқ" },

  // ── SLA Tracking ──
  "sla.title": { en: "SLA Tracking", ru: "Контроль SLA", kk: "SLA бақылау" },
  "sla.subtitle": { en: "Monitor service level agreement compliance", ru: "Мониторинг соблюдения SLA", kk: "SLA сақталуын бақылау" },
  "sla.run_check": { en: "Run SLA Check", ru: "Проверить SLA", kk: "SLA тексеру" },
  "sla.checking": { en: "Checking...", ru: "Проверка...", kk: "Тексерілуде..." },
  "sla.check_result": { en: "SLA Check Complete", ru: "Проверка SLA завершена", kk: "SLA тексеруі аяқталды" },
  "sla.checked": { en: "requests checked", ru: "заявок проверено", kk: "өтінім тексерілді" },
  "sla.marked_overdue": { en: "marked overdue", ru: "отмечено просроченными", kk: "мерзімі өткен деп белгіленді" },
  "sla.new_violations": { en: "new violations", ru: "новых нарушений", kk: "жаңа бұзушылық" },
  "sla.overdue_requests": { en: "Overdue Requests", ru: "Просроченные заявки", kk: "Мерзімі өткен өтінімдер" },
  "sla.at_risk": { en: "At Risk (< 4h)", ru: "В зоне риска (< 4ч)", kk: "Тәуекел аймағында (< 4с)" },
  "sla.compliance_rate": { en: "Compliance Rate", ru: "Показатель соблюдения", kk: "Сақтау көрсеткіші" },
  "sla.overdue_title": { en: "Overdue Requests", ru: "Просроченные заявки", kk: "Мерзімі өткен өтінімдер" },
  "sla.no_overdue": { en: "No overdue requests", ru: "Нет просроченных заявок", kk: "Мерзімі өткен өтінімдер жоқ" },
  "sla.at_risk_title": { en: "At Risk (deadline within 4h)", ru: "В зоне риска (дедлайн менее 4ч)", kk: "Тәуекел аймағы (мерзім 4 сағаттан аз)" },
  "sla.no_at_risk": { en: "No requests at risk", ru: "Нет заявок в зоне риска", kk: "Тәуекелдегі өтінімдер жоқ" },
  "sla.violations_log": { en: "Recent Violations", ru: "Последние нарушения", kk: "Соңғы бұзушылықтар" },
  "sla.no_violations": { en: "No violations recorded", ru: "Нарушений нет", kk: "Бұзушылықтар тіркелмеген" },
  "sla.col_request": { en: "Request", ru: "Заявка", kk: "Өтінім" },
  "sla.col_worker": { en: "Worker", ru: "Работник", kk: "Қызметкер" },
  "sla.col_delay": { en: "Delay", ru: "Задержка", kk: "Кешігу" },
  "sla.col_date": { en: "Date", ru: "Дата", kk: "Күні" },
  "sla.unassigned": { en: "Unassigned", ru: "Не назначен", kk: "Тағайындалмаған" },

  // ── Worker Rankings ──
  "rankings.title": { en: "Worker Rankings", ru: "Рейтинг работников", kk: "Қызметкерлер рейтингі" },
  "rankings.subtitle": { en: "Performance leaderboard for field workers", ru: "Таблица лидеров полевых работников", kk: "Қызметкерлердің нәтижелер кестесі" },
  "rankings.recalculate": { en: "Recalculate Scores", ru: "Пересчитать баллы", kk: "Ұпайларды қайта есептеу" },
  "rankings.recalculating": { en: "Recalculating...", ru: "Пересчёт...", kk: "Қайта есептеу..." },
  "rankings.total_workers": { en: "Total Workers", ru: "Всего работников", kk: "Барлық қызметкерлер" },
  "rankings.total_completed": { en: "Tasks Completed", ru: "Заданий выполнено", kk: "Орындалған тапсырмалар" },
  "rankings.total_violations": { en: "SLA Violations", ru: "Нарушений SLA", kk: "SLA бұзушылықтары" },
  "rankings.avg_score": { en: "Avg Score", ru: "Средний балл", kk: "Орташа ұпай" },
  "rankings.leaderboard": { en: "Leaderboard", ru: "Таблица лидеров", kk: "Көшбасшылар кестесі" },
  "rankings.no_workers": { en: "No workers registered yet", ru: "Работники ещё не зарегистрированы", kk: "Қызметкерлер әлі тіркелмеген" },
  "rankings.col_rank": { en: "Rank", ru: "Место", kk: "Орын" },
  "rankings.col_worker": { en: "Worker", ru: "Работник", kk: "Қызметкер" },
  "rankings.col_completed": { en: "Completed", ru: "Выполнено", kk: "Орындалды" },
  "rankings.col_violations": { en: "Violations", ru: "Нарушения", kk: "Бұзушылықтар" },
  "rankings.col_rating": { en: "Rating", ru: "Рейтинг", kk: "Рейтинг" },
  "rankings.col_score": { en: "Score", ru: "Балл", kk: "Ұпай" },
  "rankings.unnamed": { en: "Unnamed", ru: "Без имени", kk: "Атсыз" },
  "rankings.formula_title": { en: "Scoring Formula", ru: "Формула расчёта", kk: "Есептеу формуласы" },
  "rankings.formula_desc": { en: "Scores reward task completion and penalize SLA violations. Higher scores indicate better performance.", ru: "Баллы поощряют выполнение заданий и штрафуют за нарушения SLA. Более высокие баллы означают лучшую производительность.", kk: "Ұпайлар тапсырмаларды орындағаны үшін марапаттайды және SLA бұзушылықтары үшін жазалайды. Жоғары ұпайлар жақсы нәтижені білдіреді." },

  // ── Admin Map ──
  "admin.map.title": { en: "City Map", ru: "Карта города", kk: "Қала картасы" },
  "admin.map.subtitle": { en: "All active service requests across the city", ru: "Все активные заявки по всему городу", kk: "Қала бойынша барлық белсенді өтінімдер" },

  // ── Gamification Levels ──
  "level.1.title": { en: "New Resident", ru: "Новый житель", kk: "Жаңа тұрғын" },
  "level.1.desc": { en: "Welcome to CityFix. Submit reports to help improve your community.", ru: "Добро пожаловать в CityFix. Подавайте заявки для улучшения города.", kk: "CityFix-ке қош келдіңіз. Қалаңызды жақсарту үшін өтінімдер жіберіңіз." },
  "level.2.title": { en: "Community Member", ru: "Член сообщества", kk: "Қоғам мүшесі" },
  "level.2.desc": { en: "You are making a difference. Your reports help keep the city running smoothly.", ru: "Вы вносите вклад. Ваши заявки помогают городу работать лучше.", kk: "Сіз өзгеріс жасаудасыз. Өтінімдеріңіз қалаға көмектеседі." },
  "level.3.title": { en: "Active Contributor", ru: "Активный участник", kk: "Белсенді қатысушы" },
  "level.3.desc": { en: "Your consistent engagement helps prioritize issues across the city.", ru: "Ваше постоянное участие помогает расставить приоритеты проблем.", kk: "Тұрақты қатысуыңыз мәселелерді басымдық бойынша бөлуге көмектеседі." },
  "level.4.title": { en: "Neighborhood Champion", ru: "Чемпион района", kk: "Аудан чемпионы" },
  "level.4.desc": { en: "A recognized advocate for community improvement. Thank you for your dedication.", ru: "Признанный защитник улучшения города. Спасибо за преданность.", kk: "Қала жақсаруының мойындалған жақтаушысы. Адалдығыңызға рахмет." },
  "level.5.title": { en: "Civic Leader", ru: "Гражданский лидер", kk: "Азаматтық көшбасшы" },
  "level.5.desc": { en: "Among the most active citizens on CityFix. Your contributions shape the city.", ru: "Один из самых активных граждан CityFix. Ваш вклад формирует город.", kk: "CityFix-тегі ең белсенді азаматтардың бірі. Сіздің үлесіңіз қаланы қалыптастырады." },
  "level.label": { en: "Level", ru: "Уровень", kk: "Деңгей" },
  "level.reports": { en: "reports", ru: "заявок", kk: "өтінім" },
  "level.report": { en: "report", ru: "заявка", kk: "өтінім" },
  "level.next": { en: "Next", ru: "Далее", kk: "Келесі" },
  "level.max": { en: "Highest level reached. Thank you for your outstanding civic engagement.", ru: "Достигнут максимальный уровень. Спасибо за выдающееся участие.", kk: "Ең жоғары деңгейге жеттіңіз. Керемет белсенділігіңіз үшін рахмет." },

  // ── Common ──
  "common.work": { en: "Work", ru: "Работа", kk: "Жұмыс" },
  "common.report": { en: "Report", ru: "Заявка", kk: "Өтінім" },
}

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const saved = localStorage.getItem("cityfix-locale")
    if (saved && (saved === "en" || saved === "ru" || saved === "kk")) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("cityfix-locale", l)
  }, [])

  const t = useCallback(
    (key: string): string => {
      return translations[key]?.[locale] ?? key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}
