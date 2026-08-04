export type EmailBlockType = 'heading' | 'text' | 'button' | 'image' | 'divider' | 'spacer';

export type EmailBlockAlign = 'left' | 'center' | 'right';

export interface EmailBlockBase {
  id: string;
  type: EmailBlockType;
}

export interface HeadingBlock extends EmailBlockBase {
  type: 'heading';
  text: string;
  level: 1 | 2 | 3;
  align: EmailBlockAlign;
}

export interface TextBlock extends EmailBlockBase {
  type: 'text';
  text: string;
  align: EmailBlockAlign;
}

export interface ButtonBlock extends EmailBlockBase {
  type: 'button';
  label: string;
  href: string;
  align: EmailBlockAlign;
}

export interface ImageBlock extends EmailBlockBase {
  type: 'image';
  src: string;
  alt: string;
  width?: number;
}

export interface DividerBlock extends EmailBlockBase {
  type: 'divider';
}

export interface SpacerBlock extends EmailBlockBase {
  type: 'spacer';
  height: number;
}

export type EmailBlock =
  | HeadingBlock
  | TextBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock;

export const createBlock = (type: EmailBlockType): EmailBlock => {
  const id = crypto.randomUUID();
  switch (type) {
    case 'heading':
      return { id, type, text: 'Título da seção', level: 2, align: 'left' };
    case 'text':
      return { id, type, text: 'Escreva seu parágrafo aqui. Apresente o valor da sua oferta de forma clara.', align: 'left' };
    case 'button':
      return { id, type, label: 'Saiba mais', href: 'https://exemplo.com', align: 'center' };
    case 'image':
      return { id, type, src: 'https://placehold.co/600x300/png?text=Imagem', alt: 'Imagem', width: 600 };
    case 'divider':
      return { id, type };
    case 'spacer':
      return { id, type, height: 24 };
  }
};
