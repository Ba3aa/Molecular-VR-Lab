import { createWithEqualityFn } from 'zustand/traditional';

export const useAppStore = createWithEqualityFn((set) => ({
  isVrActive: false,
  setVrActive: (status) => set({ isVrActive: status }),

  // الجزيء المحدد حالياً في مشهد VR — null يعني لا شيء محدد
  selectedModel: null,
  setSelectedModel: (model) => set({ selectedModel: model }),

  // وضع الـ DNA — يغير النماذج من جزيئات منفردة إلى جزيئات مرتبطة بالـ DNA
  isDnaMode: false,
  setDnaMode: (value) => set({ isDnaMode: value }),
  toggleDnaMode: () => set((state) => ({ isDnaMode: !state.isDnaMode })),
}));
