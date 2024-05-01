const url = 'https://ashura-senpai.github.io/prova-programacao-web'

const apiUrl = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados'

let municipiosUrl = ''
let favoritosUrl = ''

describe('Prova de Programação Web', () => {
  describe('Estrutura da Página (1.5 pontos)', () => {
    beforeEach(() => {
      cy.visit(url)
    })

    it('Salva favoritosUrl', () => {
      cy.get('a')
        .not('main a')
        .contains('favoritos', {
          matchCase: false,
        })
        .invoke('attr', 'href')
        .then((href) => {
          if (href.startsWith('.')) {
            favoritosUrl = href.replace(/[.]/, '').split('=')[0]
          } else {
            favoritosUrl = '/' + href.split('=')[0]
          }
        })
    })

    it('(1) Utilize uma grid para organizar o conteúdo da página, onde o conteúdo principal (main) ocupa a maior parte do espaço', () => {
      cy.get('main').parent().should('have.css', 'display', 'grid')
    })

    it('(0.25) O header tem cor de fundo #0074d9 e o footer tem cor de fundo #333', () => {
      cy.get('header').should(
        'have.css',
        'background-color',
        'rgb(0, 116, 217)'
      )

      cy.get('footer').should('have.css', 'background-color', 'rgb(51, 51, 51)')
    })

    it('(0.25) Adicione o texto "© 2024 Prova de Programação Web" no footer', () => {
      cy.get('footer').contains('© 2024 Prova de Programação Web', {
        matchCase: false,
      })
    })
  })

  describe('Página de Estados (./index.html) (2.5 pontos)', () => {
    beforeEach(() => {
      cy.intercept('GET', `${apiUrl}*`).as('ibgeRequest')

      cy.visit(url)
    })

    it('(1) Utilize a API do IBGE para buscar dados dos estados brasileiros', () => {
      cy.wait('@ibgeRequest', { timeout: 10000 })
        .its('response.statusCode')
        .should('eq', 200)
    })

    it('(0.25) Liste o nome de cada estado dentro de uma lista (ul/li).', () => {
      cy.get('main ul li').should('exist')
      cy.get('main ul > li').should('have.length.above', 1)
    })

    it('(0.25) Remova os bullet points da lista', () => {
      cy.get('main ul').should('exist')
      cy.get('main ul').should('satisfy', ($ul) => {
        const listStyleType = $ul.css('list-style-type')
        const listStyle = $ul.css('list-style')
        const listItemStyle = $ul.find('li').css('list-style-type')
        return (
          listStyleType === 'none' ||
          listStyle === 'none' ||
          listItemStyle === 'none'
        )
      })
    })

    it('(0.5) Cada estado deve ser um link (âncora) que direciona para a página de municípios (./municipios/index.html), passando o UF do estado via querystring', () => {
      cy.get('main ul a').should('exist')

      cy.get('main ul a:first-of-type').should(($a) => {
        let href = $a.attr('href')

        if (href.startsWith('.')) {
          municipiosUrl = href.replace(/[.]/, '').split('=')[0]
        } else {
          municipiosUrl = '/' + href.split('=')[0]

          console.log({ municipiosUrl })
        }
      })

      cy.get('main ul a').should('have.attr', 'href').and('match', /[?=]/)
    })

    it('(0.5) Os links (âncoras) devem ter cor #333 com uma transição no hover para alterar a opacidade para 0.8', () => {
      cy.get('main ul a').should('have.css', 'color', 'rgb(51, 51, 51)')
      cy.get('main ul a').should('have.css', 'transition')
    })
  })

  describe('Página de Municípios (./municipios/index.html) (4 pontos)', () => {
    beforeEach(() => {
      cy.intercept('GET', `${apiUrl}/*/municipios`).as('ibgeMunicipiosRequest')

      cy.visit(`${url}${municipiosUrl}=AP`)
    })

    it('(1) Utilize a API do IBGE para buscar os municípios de um estado específico, baseado no UF passado via querystring', () => {
      cy.wait('@ibgeMunicipiosRequest', { timeout: 10000 })
        .its('response.statusCode')
        .should('eq', 200)
    })

    it('(0.5) Exiba o título da página como "Municípios de {UF}", onde {UF} é substituído pelo UF recebido na querystring', () => {
      cy.get('h1').contains('Municípios de AP', { matchCase: false })
    })

    it('(0.25) Liste os municípios dentro de uma lista não ordenada (ul)', () => {
      cy.get('main ul').should('exist')
      cy.get('main ul > li').should('have.length.above', 1)
    })

    it('(0.25) Remova os bullet points da lista', () => {
      cy.get('main ul').should('satisfy', ($ul) => {
        const listStyleType = $ul.css('list-style-type')
        const listStyle = $ul.css('list-style')
        const listItemStyle = $ul.find('li').css('list-style-type')
        return (
          listStyleType === 'none' ||
          listStyle === 'none' ||
          listItemStyle === 'none'
        )
      })
    })

    it('(0.25) Cada município deve ser exibido como um item de lista (li) com o nome do município e um botão para favoritar', () => {
      cy.get('main ul').should('exist')
      cy.get('main ul > li')
        .should('have.length.above', 1)
        .should(($lis) => {
          const button = $lis.first().find('button')[0]
          expect(button).to.exist
          button.innerText.includes('Favoritar', { matchCase: false })
        })
    })

    it('(0.25) O botão de favoritar deve ter cor de fundo #ff4136 e uma transição no hover para alterar a opacidade para 0.8', () => {
      cy.get('main ul').should('exist')

      cy.get('main ul > li:first-of-type button')
        .should('have.css', 'background-color', 'rgb(255, 65, 54)')
        .and('have.css', 'transition')
    })

    it('(1.5) Ao clicar no botão de favoritar, o objeto do município deve ser adicionado a uma lista de favoritos no localStorage. Utilize favoritos como nome da chave localStorage', () => {
      cy.get('main ul > li:first-child').within(($li) => {
        $li.find('button').click()
        cy.window()
          .its('localStorage')
          .invoke('getItem', 'favoritos')
          .should('include', 'Serra do Navio')
      })
    })
  })

  describe('Página de Favoritos (./favoritos/index.html) (1 ponto)', () => {
    it('(1) Buscar a lista de favoritos salva em localStorage e exibir o nome do municipio em uma ul/li cada município favoritado.', () => {
      localStorage.setItem(
        'favoritos',
        JSON.stringify([
          {
            id: 1506351,
            nome: 'Santa Bárbara do Pará',
          },
          {
            id: 1600238,
            nome: 'Ferreira Gomes',
          },
          {
            id: 1600279,
            nome: 'Laranjal do Jari',
          },
        ])
      )

      cy.visit(`${url}${favoritosUrl}`)

      cy.window()
        .its('localStorage')
        .invoke('getItem', 'favoritos')
        .then((favoritos) => {
          const favoritosArray = JSON.parse(favoritos)
          cy.get('main ul li').should('have.length', favoritosArray.length)
          favoritosArray.forEach((favorito, index) => {
            cy.get('main ul > li').eq(index).contains(favorito.nome)
          })
        })
    })
  })

  describe('Funcionalidades Extras (0.5 pontos)', () => {
    it('(0.25) Adicione um link (âncora) com o texto "Ver favoritos", no header da página principal e na página de municípios, o link deve direcionar para a página de favoritos (./favoritos/index.html)', () => {
      cy.visit(url)

      cy.get('header a')
        .should('have.attr', 'href')
        .and('include', 'favoritos/index.html')

      cy.visit(`${url}${municipiosUrl}=AP`)

      cy.get('header a')
        .should('exist')
        .should(($anchors) => {
          const filteredAnchors = $anchors.filter((index, anchor) => {
            return anchor.textContent
              .trim()
              .toLowerCase()
              .includes('favorito', { matchCase: false })
          })

          expect(filteredAnchors).to.have.length.above(0)

          const href = filteredAnchors[0].getAttribute('href')
          expect(href).to.include('favoritos/index.html')
        })
    })

    it('(0.25) Adicione um link (âncora) com o texto "Ir para a home", no header das páginas de municípios e de favoritos, que direciona para a página principal (./index.html)', () => {
      cy.visit(`${url}${municipiosUrl}=AP`)

      cy.get('header a').should('satisfy', ($a) => {
        const attr = $a.attr('href')
        return attr.includes('../index.html') || listStyle === '../'
      })

      cy.visit(`${url}${favoritosUrl}`)

      cy.get('header a').should('satisfy', ($a) => {
        const attr = $a.attr('href')
        return attr === '../index.html' || listStyle === '../'
      })
    })
  })
})
