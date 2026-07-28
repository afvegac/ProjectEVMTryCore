import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  let fixture: ComponentFixture<StatusBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadge);
  });

  function render(inputs: Record<string, unknown>): HTMLElement {
    Object.entries(inputs).forEach(([name, value]) => {
      fixture.componentRef.setInput(name, value);
    });
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('traduce el estado de costo a una etiqueta en español', () => {
    const element = render({ kind: 'cost', status: 'OVER_BUDGET' });

    expect(element.textContent).toContain('Sobre presupuesto');
  });

  it('traduce el estado de cronograma a una etiqueta en español', () => {
    const element = render({ kind: 'schedule', status: 'BEHIND' });

    expect(element.textContent).toContain('Atrasado');
  });

  /**
   * El color no puede ser el único canal: un semáforo que solo cambia de tono es ilegible para
   * quien no distingue rojo de verde y se pierde al imprimir.
   */
  it('acompaña el color con un símbolo y un texto', () => {
    const element = render({ kind: 'cost', status: 'UNDER_BUDGET' });

    expect(element.querySelector('.badge__symbol')?.textContent?.trim()).toBe(
      '▲',
    );
    expect(element.querySelector('.badge__label')?.textContent?.trim()).toBe(
      'Bajo presupuesto',
    );
  });

  it('explica por qué falta el dato cuando el indicador es indeterminado', () => {
    const element = render({
      kind: 'cost',
      status: 'NOT_AVAILABLE',
      reason: 'NOT_STARTED',
    });

    expect(element.textContent).toContain('Sin dato');
    expect(element.textContent).toContain('la actividad no ha comenzado');
  });
});
