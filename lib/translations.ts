export type Language = 'en' | 'vi';

export const backendTranslations = {
  vi: {
    nav: {
      myStories: 'Câu chuyện của tôi',
      newStory: 'Thêm câu chuyện',
      familySpace: 'Không gian gia đình',
      profile: 'Hồ sơ',
      signOut: 'Đăng xuất',
    },
    dashboard: {
      greeting: 'Xin chào',
      subHasStories: (count: number) =>
        `Bạn đã lưu giữ ${count} câu ${count === 1 ? 'chuyện' : 'chuyện'}. Tiếp tục nhé!`,
      subNoStories: 'Hãy bắt đầu ghi lại ký ức gia đình đầu tiên hôm nay.',
      newStoryBtn: '+ Câu chuyện mới',
      stats: {
        stories: 'Câu chuyện',
        audioRecordings: 'Bản ghi âm',
        familyMember: 'Thành viên gia đình',
      },
      empty: {
        title: 'Chưa có câu chuyện nào',
        desc: 'Chỉ cần một câu hỏi sâu sắc là đủ. Chọn một gợi ý và để ký ức quay trở lại.',
        cta: 'Tạo câu chuyện đầu tiên',
      },
      story: {
        audioRecorded: '🎙 Đã ghi âm',
        readMore: 'Đọc thêm →',
      },
    },
    profile: {
      backToStories: '← Quay lại câu chuyện',
      memberSince: 'Thành viên từ',
      stats: {
        totalStories: 'Tổng câu chuyện',
        roots: 'Nguồn cội',
        traditions: 'Truyền thống',
        lifeLessons: 'Bài học cuộc đời',
      },
      actions: {
        newStory: '+ Câu chuyện mới',
        familySpace: 'Không gian gia đình',
        signOut: 'Đăng xuất',
      },
    },
    family: {
      title: 'Không gian gia đình',
      comingSoon: 'Sắp ra mắt',
      backToDashboard: '← Quay lại',
    },
    story: {
      backToDashboard: '← Quay lại câu chuyện',
      audioSection: 'Bản ghi âm',
      textSection: 'Nội dung',
      editStory: 'Chỉnh sửa',
      deleteStory: 'Xóa',
      category: 'Danh mục',
      createdAt: 'Ngày tạo',
    },
    languageSwitcher: {
      label: 'Ngôn ngữ',
    },
    newStory: {
      backToStories: '← Quay lại câu chuyện',
      stepCategory: {
        eyebrow: 'Bắt đầu lưu trữ',
        title: 'Bạn muốn khám phá điều gì?',
        desc: 'Chọn một chủ đề để khám phá những câu hỏi sâu sắc.',
      },
      stepRecord: {
        changeTheme: '← Đổi chủ đề',
        title: 'Ghi lại câu chuyện của họ.',
        desc: 'Viết xuống, ghi âm giọng nói, hoặc cả hai.',
        anotherPrompt: 'Câu hỏi khác ↻',
        titleLabel: 'Tiêu đề câu chuyện (tùy chọn)',
        titlePlaceholder: 'VD: Công thức bí mật của bà...',
        storyLabel: 'Câu chuyện viết tay',
        storyPlaceholder: 'Tôi nhớ khi...',
        stopRecording: 'Dừng ghi âm —',
        startRecording: 'Bắt đầu ghi âm',
        recorded: '✓ Đã ghi',
        saving: 'Đang lưu…',
        save: '💾 Lưu vào Kho Gia Đình',
      },
    },
  },
  en: {
    nav: {
      myStories: 'My Stories',
      newStory: 'New Story',
      familySpace: 'Family Space',
      profile: 'Profile',
      signOut: 'Sign Out',
    },
    dashboard: {
      greeting: 'Hello',
      subHasStories: (count: number) =>
        `You have preserved ${count} ${count === 1 ? 'story' : 'stories'}. Keep it going!`,
      subNoStories: 'Start capturing your first family memory today.',
      newStoryBtn: '+ New Story',
      stats: {
        stories: 'Stories',
        audioRecordings: 'Audio Recordings',
        familyMember: 'Family Member',
      },
      empty: {
        title: 'No stories preserved yet',
        desc: 'A single thoughtful question is all it takes. Pick a prompt and let the memories return.',
        cta: 'Create First Story',
      },
      story: {
        audioRecorded: '🎙 Audio recorded',
        readMore: 'Read story →',
      },
    },
    profile: {
      backToStories: '← Back to Stories',
      memberSince: 'Member since',
      stats: {
        totalStories: 'Total Stories',
        roots: 'Roots',
        traditions: 'Traditions',
        lifeLessons: 'Life Lessons',
      },
      actions: {
        newStory: '+ New Story',
        familySpace: 'Family Space',
        signOut: 'Sign Out',
      },
    },
    family: {
      title: 'Family Space',
      comingSoon: 'Coming Soon',
      backToDashboard: '← Back',
    },
    story: {
      backToDashboard: '← Back to Stories',
      audioSection: 'Audio Recording',
      textSection: 'Content',
      editStory: 'Edit',
      deleteStory: 'Delete',
      category: 'Category',
      createdAt: 'Created',
    },
    languageSwitcher: {
      label: 'Language',
    },
    newStory: {
      backToStories: '← Back to Stories',
      stepCategory: {
        eyebrow: 'Begin your archive',
        title: 'What would you like to explore?',
        desc: 'Choose a theme to discover thoughtful prompts.',
      },
      stepRecord: {
        changeTheme: '← Change theme',
        title: 'Capture their story.',
        desc: 'Write it down, record their voice, or both.',
        anotherPrompt: 'Another prompt ↻',
        titleLabel: 'Story Title (optional)',
        titlePlaceholder: 'e.g. Grandma\'s secret recipe...',
        storyLabel: 'Written Story',
        storyPlaceholder: 'I remember when...',
        stopRecording: 'Stop recording —',
        startRecording: 'Record story',
        recorded: '✓ Recorded',
        saving: 'Saving…',
        save: '💾 Save to Family Archive',
      },
    },
  },
};

export type BackendT = typeof backendTranslations.en;

export const translations = {
  vi: {
    nav: {
      howItWorks: 'Cách hoạt động',
      stories: 'Câu chuyện',
      try: 'Thử ngay',
      login: 'Đăng nhập',
      signup: 'Bắt đầu',
      startNow: 'Bắt đầu ngay',
    },
    hero: {
      eyebrow: 'Những cuộc trò chuyện nhỏ. Một kết nối lâu dài.',
      headlinePart1: 'Câu chuyện của họ.',
      headlinePart2: 'Giọng nói của họ.',
      headlinePart3: 'Mãi bên bạn.',
      description:
        'Cả một cuộc đời nằm sau người mà bạn gọi là Bà, là Mẹ, là Cha. Hãy giúp họ kể lại — từng ký ức một.',
      cta: 'Lưu giữ ký ức gia đình',
      subtext: 'Chỉ cần một câu hỏi là đủ để bắt đầu.',
      badge: 'Cho thế hệ tiếp theo',
      audioTitle: 'Ký ức Tết năm ấy',
      audioAuthor: 'Bà nội · 1958',
    },
    howItWorks: {
      eyebrow: 'Một chút thời gian bên nhau',
      titleMain: 'Cả đời ký ức.',
      titleSub: 'Từng cuộc trò chuyện một.',
      subtitle:
        'Không cần trang trắng. Không cần phải là nhà văn. Chỉ cần một giọng nói quen thuộc và một nơi để bắt đầu.',
      step1Label: 'HỎI',
      step1Title: 'Bắt đầu với một câu hỏi hay.',
      step1Desc:
        'Từ những cuộc phiêu lưu thời thơ ấu đến công thức nấu ăn ai cũng hỏi — một câu hỏi nhẹ nhàng sẽ đưa ký ức quay trở lại.',
      step2Label: 'NGHE',
      step2Title: 'Để câu chuyện được kể.',
      step2Desc:
        'Cùng ngồi xuống và ghi lại bằng ngôn ngữ cảm thấy như ở nhà. Những chi tiết nhỏ mới là phần quý giá nhất.',
      step3Label: 'GIỮ',
      step3Title: 'Giữ hơn cả những từ ngữ.',
      step3Desc:
        'Tải bản ghi âm và lưu những ký ức bằng văn bản. Giữ lại tiếng cười, những khoảng lặng, và giọng nói của họ.',
    },
    categories: {
      eyebrow: 'Những điều thường ngày mới là tất cả',
      titlePart1: 'Không chỉ những khoảnh khắc lớn.',
      titlePart2: 'Những điều nhỏ đẹp đẽ.',
      subtitle: 'Những câu chuyện tạo nên gia đình của bạn, là gia đình của bạn.',
      explore: 'Khám phá',
    },
    questionDemo: {
      eyebrow: 'Trải nghiệm thử',
      title: 'Thử một câu hỏi.',
      subtitle: 'Xem những ký ức nào xuất hiện trong tâm trí bạn.',
      tabRoots: 'Nguồn Cội',
      tabTraditions: 'Truyền Thống',
      tabLessons: 'Bài Học Cuộc Đời',
      anotherQuestion: 'Câu hỏi khác ↻',
      writeTab: 'Ghi chép',
      recordTab: 'Ghi âm',
      writePlaceholder:
        'Bắt đầu gõ ở đây... Có những câu chuyện chỉ cần một vài dòng ngắn là đủ để gợi nhớ cả một thời khắc đáng nhớ.',
      recording: 'Đang ghi âm...',
      startRecord: 'Bắt đầu ghi âm',
      stopRecord: 'Dừng ghi âm',
      recordHint: 'Nhấp để bắt đầu ghi âm. Cho phép trình duyệt truy cập micro.',
      listenBack: 'Nghe lại:',
      recordAgain: 'Ghi âm lại',
      download: 'Tải xuống',
      downloadNote:
        'Bản ghi âm đã sẵn sàng! Bạn có thể tải về hoặc tạo tài khoản để lưu mãi mãi.',
      ctaQuestion: 'Bạn thích trải nghiệm này?',
      ctaDesc:
        'Tạo tài khoản miễn phí để lưu trữ không giới hạn câu chuyện và xây dựng kho báu gia đình.',
      ctaButton: 'Tạo tài khoản lưu trữ',
    },
    cta: {
      label: 'KÝ + ỨC. GIA ĐÌNH + CÂU CHUYỆN.',
      titlePart1: 'Một ngày nào đó, điều này sẽ có ý nghĩa',
      titlePart2: 'với tất cả mọi người.',
      button: 'Bắt đầu với một câu hỏi',
    },
    footer: {
      tagline: 'Giữ mãi câu chuyện gia đình bạn.',
      bilingual: 'Tiếng Việt & English · Sẵn sàng sử dụng',
      copyright: '© 2026 kyuc°. Dành trọn tình yêu cho các gia đình.',
    },
  },

  en: {
    nav: {
      howItWorks: 'How it works',
      stories: 'Stories',
      try: 'Try it',
      login: 'Log in',
      signup: 'Get Started',
      startNow: 'Start now',
    },
    hero: {
      eyebrow: 'Small conversations. A lasting connection.',
      headlinePart1: 'Their stories.',
      headlinePart2: 'Their voices.',
      headlinePart3: 'Forever with you.',
      description:
        'A lifetime of memories lives behind the person you call Mom, Dad, or Grandparent. Help them tell it — one question at a time.',
      cta: 'Preserve Family Stories',
      subtext: 'Just one question is all it takes to begin.',
      badge: 'For the next generation',
      audioTitle: 'Lunar New Year 1968',
      audioAuthor: 'Grandmother · 1958',
    },
    howItWorks: {
      eyebrow: 'A few moments together',
      titleMain: 'A lifetime of memories.',
      titleSub: 'One conversation at a time.',
      subtitle:
        'No blank pages. No need to be a writer. Just a familiar voice and a place to start.',
      step1Label: 'ASK',
      step1Title: 'Start with a good question.',
      step1Desc:
        'From childhood adventures to the family recipe everyone asks for — a thoughtful prompt brings the memories back.',
      step2Label: 'LISTEN',
      step2Title: 'Let the story unfold.',
      step2Desc:
        'Sit together and record in the language that feels like home. The little details are the ones that matter most.',
      step3Label: 'KEEP',
      step3Title: 'Keep more than just words.',
      step3Desc:
        'Download the recording and keep written memories too. Hold onto the laughter, the pauses, and the voice itself.',
    },
    categories: {
      eyebrow: 'The everyday is everything',
      titlePart1: 'Not just the big milestones.',
      titlePart2: 'The beautiful small things.',
      subtitle: 'The stories that made your family who they are.',
      explore: 'Explore',
    },
    questionDemo: {
      eyebrow: 'Interactive Preview',
      title: 'Try a question.',
      subtitle: 'See what comes back when you ask.',
      tabRoots: 'Roots',
      tabTraditions: 'Traditions',
      tabLessons: 'Life Lessons',
      anotherQuestion: 'Another question ↻',
      writeTab: 'Write',
      recordTab: 'Record',
      writePlaceholder:
        'Start typing here... Even a few sentences can capture a whole world of memories.',
      recording: 'Recording in progress...',
      startRecord: 'Start recording',
      stopRecord: 'Stop recording',
      recordHint: 'Click to start recording. Please allow microphone access.',
      listenBack: 'Listen back:',
      recordAgain: 'Record again',
      download: 'Download',
      downloadNote:
        'Your recording is ready! You can download it or create an account to save it forever.',
      ctaQuestion: 'Enjoyed this prompt?',
      ctaDesc:
        'Create a free account to save unlimited stories and build a private family archive.',
      ctaButton: 'Create Free Account',
    },
    cta: {
      label: 'MEMORY + ARCHIVE. FAMILY + STORIES.',
      titlePart1: 'One day, this will mean everything',
      titlePart2: 'to someone you love.',
      button: 'Start with a question',
    },
    footer: {
      tagline: 'Keep your family’s stories alive.',
      bilingual: 'English & Vietnamese · Ready to use',
      copyright: '© 2026 kyuc°. Made with love for families.',
    },
  },
};
