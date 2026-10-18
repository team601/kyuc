// Nội dung trang chủ (EN / VI). Ảnh nằm trong public/images/home, gọi theo tên không kèm đuôi file.
import type { Language } from './translations';

export interface HomeStep {
  label: string;
  title: string;
  body: string;
  planned?: boolean;
  image: string;
  imageAlt: string;
  /** Phía hiển thị chữ; ảnh nền nên chừa trống phía này */
  side: 'left' | 'right';
  /** object-position cho ảnh tạm, giữ chủ thể ở phía đối diện chữ */
  focus: string;
}

const steps = {
  en: [
    { label: '01 · Set up', title: 'Start with the person, not the app.', body: 'Add their name, their language, and what the family calls them: Má, Ngoại, Grandma. Every question is written for them.', image: 'kyuc-step-1-setup', imageAlt: 'A granddaughter helping her grandmother with a phone at home', side: 'left', focus: '70% 50%' },
    { label: '02 · Just talk', title: 'One question a week. One big button.', body: 'They tap and talk, at their own pace. Pause, listen back, or type instead. No right or wrong answers.', image: 'kyuc-step-2-talk', imageAlt: 'A grandfather telling a lively story to his grandson', side: 'right', focus: '40% 45%' },
    { label: '03 · Gentle follow-ups', title: 'The details that make a memory vivid.', body: 'A follow-up drawn only from what they just said: the smell of the kitchen, the sound of the street. Skip anytime.', planned: true, image: 'kyuc-step-3-kitchen', imageAlt: 'A grandmother cooking in the kitchen with her granddaughter', side: 'left', focus: '70% 50%' },
    { label: '04 · Review', title: 'Her words, made easy to read.', body: 'A clear story drafted from the real recording, always beside the original. Nothing is added, and nothing is shared until she approves it.', planned: true, image: 'kyuc-step-4-review', imageAlt: 'A smiling grandmother reading on a tablet', side: 'right', focus: '30% 45%' },
    { label: '05 · Keep it in the family', title: 'A private archive the whole family can hear.', body: 'Invite children and grandchildren to listen, read, react and suggest the next question.', image: 'kyuc-step-5-family', imageAlt: 'A grandmother sharing a Lunar New Year meal with her granddaughter', side: 'left', focus: '65% 55%' },
  ],
  vi: [
    { label: '01 · Thiết lập', title: 'Bắt đầu từ người kể, không phải từ ứng dụng.', body: 'Nhập tên, ngôn ngữ và cách cả nhà vẫn gọi: Má, Ngoại, Bà. Mỗi câu hỏi đều được viết riêng cho họ.', image: 'kyuc-step-1-setup', imageAlt: 'Cháu gái chỉ bà cách dùng điện thoại ở nhà', side: 'left', focus: '70% 50%' },
    { label: '02 · Cứ kể thôi', title: 'Mỗi tuần một câu hỏi. Một nút bấm thật to.', body: 'Chạm và kể, chậm rãi theo ý mình. Có thể tạm dừng, nghe lại hoặc viết thay vì nói. Không có câu trả lời đúng hay sai.', image: 'kyuc-step-2-talk', imageAlt: 'Ông say sưa kể chuyện cho cháu trai', side: 'right', focus: '40% 45%' },
    { label: '03 · Hỏi thêm nhẹ nhàng', title: 'Những chi tiết làm ký ức sống lại.', body: 'Câu hỏi gợi mở dựa đúng vào điều vừa được kể: mùi gian bếp, tiếng ồn của con phố. Bỏ qua bất cứ lúc nào.', planned: true, image: 'kyuc-step-3-kitchen', imageAlt: 'Bà nấu ăn cùng cháu gái trong bếp', side: 'left', focus: '70% 50%' },
    { label: '04 · Đọc lại', title: 'Lời kể của Má, dễ đọc hơn.', body: 'Một câu chuyện rõ ràng được soạn từ chính bản ghi âm, luôn nằm cạnh bản gốc. Không thêm thắt gì, và chưa chia sẻ cho đến khi Má đồng ý.', planned: true, image: 'kyuc-step-4-review', imageAlt: 'Bà mỉm cười đọc trên máy tính bảng', side: 'right', focus: '30% 45%' },
    { label: '05 · Giữ trong gia đình', title: 'Kho ký ức riêng mà cả nhà cùng nghe được.', body: 'Mời con cháu cùng nghe, cùng đọc, thả cảm xúc và gợi ý câu hỏi tiếp theo.', image: 'kyuc-step-5-family', imageAlt: 'Bà và cháu cùng ăn bữa cơm Tết', side: 'left', focus: '65% 55%' },
  ],
} satisfies Record<Language, HomeStep[]>;

export const homeContent = {
  en: {
    nav: { how: 'How It Works', keep: "What You'll Keep", story: 'Our Story', faq: 'FAQ', login: 'Log in', start: 'Start a Story', dashboard: 'Dashboard', menu: 'Menu', language: 'Language' },
    hero: {
      title: 'One conversation today. A lifetime remembered.',
      sub: 'Help your parents and grandparents tell their stories, in their own voice.',
      pilot: 'Now in pilot · English & Tiếng Việt',
      scrollHint: 'Scroll to see how it works',
    },
    comingSoon: 'Coming soon',
    steps: steps.en,
    stepCtas: { start: 'Start a Story', keep: "What you'll keep" },
    phone: {
      progressAria: 'Animated preview of the KYUC web app',
      welcome: { time: 'Sunday, 9:00', hello: 'Hi Grandma,', intro: "This week's question is ready. We can take our time.", qLabel: 'Question 3 of 12', question: 'What was your childhood home like?', cta: 'Start telling' },
      setup: { title: "Who's telling the story?", nameLabel: 'Their name', name: 'Margaret Lee', callLabel: 'The family calls her', calls: ['Grandma', 'Nana', 'Mom', 'Má'], langLabel: 'Language', langs: ['English', 'Tiếng Việt'], activeLang: 0, cta: 'Continue' },
      record: { question: 'What was your childhood home like? Tell the grandkids.', reassure: 'No right or wrong answers.', status: 'Recording · 01:42', pause: 'Pause', listen: 'Listen back' },
      follow: { saved: 'Saved · 2:14', answer: '“It was small, just two rooms. The kitchen was really the back step. My mother cooked there every morning.”', prompt: 'Want to say more?', question: 'What did the kitchen smell like when she was cooking?', more: 'Keep going', later: 'Later' },
      review: { tabs: ['Story', 'As spoken'], title: 'The back step', audio: 'Original recording · 2:14', text: 'Our house was small, just two rooms. The kitchen was really the back step, and my mother cooked there every morning. It always smelled of ginger and charcoal smoke. I can still smell it.', note: 'Drafted only from her words. Nothing added.', approve: 'Approve', edit: 'Edit' },
      family: { title: "Grandma's stories", meta: 'Private · 6 family members', story: 'The back step', storyMeta: 'Childhood home · 2:14', comments: [['Linh', "I've never heard this one!"], ['Tom', 'Can she tell us about the holidays next?'], ['Mai', 'Ginger and charcoal! Just like our kitchen.']], cta: 'Suggest the next question' },
    },
    why: {
      quote: '“There\'s so much we mean to ask the people we love.”',
      body: 'Not just the big milestones. The street they grew up on, her recipe with no measuring cups, the way he laughs at his own jokes. Start with one good question.',
      imageAlt: 'A grandmother and granddaughter smiling together with red envelopes',
    },
    archive: {
      eyebrow: 'The family archive',
      title: 'Hear her say it. Read it in her words.',
      body: 'Every story keeps the original recording beside the written version. Illustrative preview; story drafts are coming soon.',
      url: 'kyuc.ai / grandma-stories',
      sidebarTitle: "Grandma's stories",
      chapters: ['Childhood home · 3', 'Parents & grandparents · 2', 'Celebrations · 4', 'Love & marriage · 1', 'Life lessons · 2'],
      next: 'Next question: “What did the holidays feel like when you were young?”',
      tabs: ['Story', 'As spoken', 'Photos'],
      storyTitle: 'The back step',
      storyMeta: 'Told by Grandma · Childhood home · Approved',
      storyBefore: 'Our house was small, just two rooms. The kitchen was really the back step, and my mother cooked there every morning. ',
      storyHighlight: 'It always smelled of ginger and charcoal smoke.',
      storyAfter: ' I can still smell it.',
      highlightNote: 'Highlighted line plays from 1:02 in the recording.',
    },
    weekly: {
      eyebrow: 'Every week',
      title: 'A gentle nudge. Never a chore.',
      body: "One question arrives each week, in the language and words they're used to. They answer when they're ready. The family hears when a new story is in.",
      badge: 'Weekly reminders: coming soon',
      msg1: { from: 'KYUC', time: 'Sunday 9:00', text: 'Hi Grandma! This week\'s question: “Which family recipe should we keep cooking?” Tap to tell it.' },
      msg2: { from: 'Family', time: 'Sunday 11:20', text: 'Grandma just shared a new story: “Soup on rainy days.”' },
      imageAlt: 'A smiling grandmother holding her phone',
    },
    keep: {
      eyebrow: "What you'll keep",
      title: 'More than words.',
      inPilot: 'In the pilot',
      cards: [
        { title: 'Their original voice', body: 'Recordings, written memories and photos, kept together.', image: 'kyuc-voice', alt: 'A grandmother laughing while listening on a tablet', live: true },
        { title: 'A life timeline', body: 'Stories and photos arranged by the years they happened.', image: 'kyuc-old-photos', alt: 'A pile of old black-and-white family photographs', live: false },
        { title: 'A printed book', body: 'A hardcover keepsake, when your family is ready.', image: '', alt: '', live: false },
      ],
      bookTitle: "Grandma's Stories",
    },
    lang: {
      eyebrow: 'Ký Ức means “memories”',
      titleA: 'In your language.',
      titleB: 'In their own words.',
      body: 'Started by a Vietnamese family, made for every family. Questions sound natural in each language and never assume one kind of life.',
      viLabel: 'Tiếng Việt · Southern phrasing',
      viQuote: '“Hôm nay mình nói chuyện một chút thôi nha. Má cứ kể tự nhiên.”',
      viAlt: 'A grandmother teaching her granddaughter to knit at home',
      enLabel: 'English',
      enQuote: '“Hi Grandpa, ready to share a memory? We can take our time.”',
      enAlt: 'A grandmother and grandfather looking at old photographs together',
    },
    trust: {
      title: "Your family's stories belong to your family.",
      items: [
        ['Private until approved.', 'The storyteller decides what family sees.'],
        ['Consent first.', 'We explain recording before the mic turns on.'],
        ['Download or delete.', 'Any recording, any time.'],
        ['No voice cloning.', 'AI only organizes what they actually said.'],
      ],
      more: 'Read how we protect your stories',
    },
    faq: {
      title: 'Questions families ask',
      items: [
        ['Does my parent need to be good with technology?', 'No. One question, one large button, nothing to install. You can also sit together and record.'],
        ['Which languages can they speak?', 'English and Vietnamese in the pilot, including natural Southern phrasing.'],
        ['Can we fix mistakes in a story?', "Yes. Edit any story before it's shared. The original recording is always kept."],
        ['What does it cost?', "We haven't set pricing yet. Pilot families will hear first."],
      ],
    },
    closing: {
      titleA: 'Every family has a story',
      titleB: 'worth remembering.',
      body: 'Start with one question this week. One day, it will mean everything to someone you love.',
      start: 'Start a Story',
      join: 'Join the pilot',
      imageAlt: 'A grandmother laughing with her family around an outdoor dinner table',
    },
    footer: { privacy: 'Privacy', terms: 'Terms', security: 'Security', bilingual: 'In English. Bằng tiếng Việt.', copyright: '© 2026 KYUC · Pilot program' },
  },
  vi: {
    nav: { how: 'Cách hoạt động', keep: 'Những gì giữ lại', story: 'Câu chuyện của chúng tôi', faq: 'Hỏi đáp', login: 'Đăng nhập', start: 'Bắt đầu kể', dashboard: 'Bảng điều khiển', menu: 'Menu', language: 'Ngôn ngữ' },
    hero: {
      title: 'Một cuộc trò chuyện hôm nay. Một đời được ghi nhớ.',
      sub: 'Giúp ông bà, cha mẹ kể lại câu chuyện đời mình, bằng chính giọng nói của họ.',
      pilot: 'Đang thử nghiệm · Tiếng Việt & English',
      scrollHint: 'Cuộn xuống để xem cách hoạt động',
    },
    comingSoon: 'Sắp ra mắt',
    steps: steps.vi,
    stepCtas: { start: 'Bắt đầu kể', keep: 'Những gì giữ lại' },
    phone: {
      progressAria: 'Bản xem trước động của ứng dụng web KYUC',
      welcome: { time: 'Chủ nhật, 9:00', hello: 'Chào Má,', intro: 'Câu hỏi tuần này đã sẵn sàng. Mình kể từ từ thôi nha.', qLabel: 'Câu hỏi 3 / 12', question: 'Hồi nhỏ nhà Má ra sao?', cta: 'Bắt đầu kể' },
      setup: { title: 'Ai là người kể chuyện?', nameLabel: 'Tên người kể', name: 'Nguyễn Thị Lan', callLabel: 'Cả nhà gọi là', calls: ['Má', 'Ngoại', 'Bà', 'Grandma'], langLabel: 'Ngôn ngữ', langs: ['English', 'Tiếng Việt'], activeLang: 1, cta: 'Tiếp tục' },
      record: { question: 'Hồi nhỏ nhà Má ra sao? Má kể cho con cháu nghe đi.', reassure: 'Không có đúng hay sai đâu Má.', status: 'Đang ghi · 01:42', pause: 'Tạm dừng', listen: 'Nghe lại' },
      follow: { saved: 'Đã lưu · 2:14', answer: '“Nhà nhỏ lắm, có hai phòng. Bếp thì ở ngay bậc cửa sau, sáng nào má của Má cũng nấu ở đó.”', prompt: 'Má muốn kể thêm không?', question: 'Lúc má nấu ăn, căn bếp có mùi gì vậy Má?', more: 'Kể tiếp', later: 'Để sau' },
      review: { tabs: ['Câu chuyện', 'Lời kể gốc'], title: 'Bậc cửa sau', audio: 'Bản ghi âm gốc · 2:14', text: 'Nhà mình hồi đó nhỏ lắm, chỉ có hai phòng. Bếp thật ra là bậc cửa sau, sáng nào má cũng nấu ở đó. Lúc nào cũng thơm mùi gừng với khói than. Giờ Má vẫn còn nhớ mùi đó.', note: 'Soạn đúng từ lời Má kể. Không thêm gì.', approve: 'Đồng ý', edit: 'Sửa' },
      family: { title: 'Chuyện của Má', meta: 'Riêng tư · 6 người trong nhà', story: 'Bậc cửa sau', storyMeta: 'Ngôi nhà tuổi thơ · 2:14', comments: [['Linh', 'Con chưa từng nghe chuyện này!'], ['Tom', 'Can she tell us about Tết next?'], ['Mai', 'Gừng và than! Giống y bếp nội.']], cta: 'Gợi ý câu hỏi tiếp theo' },
    },
    why: {
      quote: '“Có biết bao điều mình vẫn định hỏi những người mình thương.”',
      body: 'Không chỉ những cột mốc lớn. Con phố họ lớn lên, món ăn bà nấu chẳng cần cân đo, cái cách ông tự cười với câu đùa của mình. Hãy bắt đầu bằng một câu hỏi hay.',
      imageAlt: 'Bà và cháu cùng cười, tay cầm bao lì xì đỏ',
    },
    archive: {
      eyebrow: 'Kho ký ức gia đình',
      title: 'Nghe chính giọng Má. Đọc đúng lời Má kể.',
      body: 'Mỗi câu chuyện luôn giữ bản ghi âm gốc bên cạnh bản viết. Đây là bản minh hoạ; tính năng soạn câu chuyện sắp ra mắt.',
      url: 'kyuc.ai / chuyen-cua-ma',
      sidebarTitle: 'Chuyện của Má',
      chapters: ['Ngôi nhà tuổi thơ · 3', 'Ông bà, cha mẹ · 2', 'Lễ Tết · 4', 'Tình yêu · 1', 'Bài học cuộc đời · 2'],
      next: 'Câu hỏi tới: “Tết ngày xưa nhà mình ra sao?”',
      tabs: ['Câu chuyện', 'Lời kể gốc', 'Hình ảnh'],
      storyTitle: 'Bậc cửa sau',
      storyMeta: 'Má kể · Ngôi nhà tuổi thơ · Đã duyệt',
      storyBefore: 'Nhà mình hồi đó nhỏ lắm, chỉ có hai phòng. Bếp thật ra là bậc cửa sau, sáng nào má cũng nấu ở đó. ',
      storyHighlight: 'Lúc nào cũng thơm mùi gừng với khói than.',
      storyAfter: ' Giờ Má vẫn còn nhớ mùi đó.',
      highlightNote: 'Câu được tô sáng phát từ phút 1:02 của bản ghi âm.',
    },
    weekly: {
      eyebrow: 'Mỗi tuần',
      title: 'Một lời nhắc nhẹ nhàng. Không bao giờ là gánh nặng.',
      body: 'Mỗi tuần một câu hỏi, đúng ngôn ngữ và cách nói quen thuộc. Má trả lời khi nào sẵn sàng. Cả nhà được báo khi có câu chuyện mới.',
      badge: 'Nhắc hằng tuần: sắp ra mắt',
      msg1: { from: 'KYUC', time: 'Chủ nhật 9:00', text: 'Chào Má! Câu hỏi tuần này: “Món ăn nào Má muốn con cháu tiếp tục nấu?” Chạm để kể nha.' },
      msg2: { from: 'Gia đình', time: 'Chủ nhật 11:20', text: 'Má vừa kể một câu chuyện mới: “Canh chua ngày mưa.”' },
      imageAlt: 'Bà mỉm cười cầm điện thoại',
    },
    keep: {
      eyebrow: 'Những gì giữ lại',
      title: 'Hơn cả lời nói.',
      inPilot: 'Đã có trong bản thử',
      cards: [
        { title: 'Giọng nói nguyên bản', body: 'Bản ghi âm, ký ức viết tay và hình ảnh, giữ chung một chỗ.', image: 'kyuc-voice', alt: 'Bà cười khi nghe trên máy tính bảng', live: true },
        { title: 'Dòng thời gian cuộc đời', body: 'Câu chuyện và hình ảnh xếp theo năm tháng.', image: 'kyuc-old-photos', alt: 'Chồng ảnh gia đình đen trắng cũ', live: false },
        { title: 'Cuốn sách in', body: 'Một cuốn sách bìa cứng để giữ mãi, khi gia đình sẵn sàng.', image: '', alt: '', live: false },
      ],
      bookTitle: 'Chuyện của Má',
    },
    lang: {
      eyebrow: 'Ký Ức nghĩa là “memories”',
      titleA: 'Đúng ngôn ngữ của bạn.',
      titleB: 'Đúng lời của người kể.',
      body: 'Khởi đầu từ một gia đình Việt, dành cho mọi gia đình. Câu hỏi được viết tự nhiên theo từng ngôn ngữ và không áp đặt một kiểu đời sống nào.',
      viLabel: 'Tiếng Việt · giọng miền Nam',
      viQuote: '“Hôm nay mình nói chuyện một chút thôi nha. Má cứ kể tự nhiên.”',
      viAlt: 'Bà dạy cháu gái đan len ở nhà',
      enLabel: 'English',
      enQuote: '“Hi Grandpa, ready to share a memory? We can take our time.”',
      enAlt: 'Ông bà cùng xem lại những tấm ảnh cũ',
    },
    trust: {
      title: 'Câu chuyện của gia đình bạn thuộc về gia đình bạn.',
      items: [
        ['Riêng tư cho đến khi đồng ý.', 'Người kể quyết định cả nhà được xem gì.'],
        ['Hỏi ý trước.', 'Giải thích rõ về việc ghi âm trước khi bật micro.'],
        ['Tải về hoặc xoá.', 'Bất kỳ bản ghi âm nào, bất cứ lúc nào.'],
        ['Không giả giọng.', 'AI chỉ sắp xếp đúng những gì người kể đã nói.'],
      ],
      more: 'Xem cách chúng tôi bảo vệ câu chuyện của bạn',
    },
    faq: {
      title: 'Những câu gia đình hay hỏi',
      items: [
        ['Ông bà có cần rành công nghệ không?', 'Không. Một câu hỏi, một nút bấm thật to, không cần cài đặt. Con cháu cũng có thể ngồi cùng để ghi.'],
        ['Có thể kể bằng ngôn ngữ nào?', 'Tiếng Việt và tiếng Anh trong giai đoạn thử nghiệm, có cả cách nói tự nhiên của miền Nam.'],
        ['Có sửa được lỗi trong câu chuyện không?', 'Được. Sửa thoải mái trước khi chia sẻ. Bản ghi âm gốc luôn được giữ lại.'],
        ['Chi phí bao nhiêu?', 'Chúng tôi chưa định giá. Các gia đình tham gia thử nghiệm sẽ được báo trước tiên.'],
      ],
    },
    closing: {
      titleA: 'Gia đình nào cũng có một câu chuyện',
      titleB: 'đáng được ghi nhớ.',
      body: 'Bắt đầu bằng một câu hỏi tuần này. Một ngày nào đó, nó sẽ là tất cả với người bạn thương.',
      start: 'Bắt đầu kể',
      join: 'Tham gia thử nghiệm',
      imageAlt: 'Bà cười vui bên bàn ăn ngoài trời cùng gia đình',
    },
    footer: { privacy: 'Quyền riêng tư', terms: 'Điều khoản', security: 'Bảo mật', bilingual: 'In English. Bằng tiếng Việt.', copyright: '© 2026 KYUC · Chương trình thử nghiệm' },
  },
} as const;

export type HomeContent = (typeof homeContent)['en'] | (typeof homeContent)['vi'];
