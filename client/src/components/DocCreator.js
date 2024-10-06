import {AlignmentType, Document, HeadingLevel, Packer, Paragraph, TabStopPosition, TabStopType, TextRun } from "docx";

  export class DocCreator {
    create(experiences) {
        const document = new Document({
            styles: {
                paragraphStyles: [
                    {
                        id: "Heading",
                        name: "Heading",
                        alignment: AlignmentType.CENTER,
                        run: {
                            size: 40,
                            underline: {},
                        },
                    },
                ]
            },
            sections: [{
                children: [
                    // this.createHeading("TEMP"),
                    // ...achivements.map((position) => {
                    //         const arr = [];
                    //         arr.push(this.createHeading("Experience"))
                    //         // arr.push(this.createHeading(position.title));
                    //         // arr.push(this.createSubHeading(position.summary));
                    //         return arr;
                    //     })
                    this.createHeading("Policy Summary "),
                    this.createHeading(""),
                    ...experiences
                        .map((position) => {
                            const arr = [];
                            console.log('this is experiences',position)
                            arr.push(this.createSubHeading(position.LLM));
                            arr.push(this.createSubHeading(position.vectorCatalogs))
                            arr.push(new Paragraph({
                                tabStops: [
                                    {
                                        type: TabStopType.RIGHT,
                                        position: TabStopPosition.MAX,
                                    },
                                ],
                                children: [
                                    new TextRun({
                                        text: position.question,
                                        size: 25,
                                        bold: false
                                    })
                                ],
                                spacing:{
                                    before: 200,
                                    after: 200
                                }
                            }))

                            arr.push(new Paragraph({
                                tabStops: [
                                    {
                                        type: TabStopType.RIGHT,
                                        position: TabStopPosition.MAX,
                                    },
                                ],
                                children: [
                                    new TextRun({
                                        text: position.conclusion, 
                                        size: 25,
                                    })
                                ]
                            }))

                            arr.push(new Paragraph({
                                text: '',
                            }))

                            arr.push(new Paragraph({
                                text: '',
                                thematicBreak: true,
                            }))
                            return arr;
                        })
                        .reduce((prev, curr) => prev.concat(curr), []),

                ],
            }],
        });

        return document;
    }

    createHeading(text) {
        return new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_1,
            style: "Heading",
            alignment: AlignmentType.CENTER,
            thematicBreak: true,
        });
    }

    createSubHeading(text) {
        return new Paragraph({
            text: text,
        });
    }

    createBullet(text) {
        return new Paragraph({
            text: text,
            bullet: {
                level: 0,
            },
        });
    }

    // tslint:disable-next-line:no-any
    createAchivementsList(achivements) {
        return achivements.map(
            (output_text) =>
                new Paragraph({
                    text: output_text.line_text,
                }),
        );
    }

    splitParagraphIntoBullets(text) {
        return text.split("\n\n");
    }
}