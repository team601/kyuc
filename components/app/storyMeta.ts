import a from './app.module.css';

const CATEGORIES: Record<string, { en: string; vi: string; className: string }> = {
  roots: { en: 'Roots', vi: 'Nguồn cội', className: a.blush },
  traditions: { en: 'Traditions', vi: 'Truyền thống', className: a.butter },
  life_lessons: { en: 'Life lessons', vi: 'Bài học cuộc đời', className: a.mint },
};

/** Nhãn + màu pastel của chủ đề, cùng bộ màu với thẻ bình luận trong mockup */
export function categoryTone(category: string) {
  const label = category.replace(/_/g, ' ');
  return CATEGORIES[category] ?? { en: label, vi: label, className: a.sand };
}

export function visibilityOf(story: { visibility?: string | null; is_public?: boolean | null }): 'private' | 'family' | 'public' {
  if (story.visibility === 'private' || story.visibility === 'family' || story.visibility === 'public') return story.visibility;
  return story.is_public ? 'public' : 'family';
}
